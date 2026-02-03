import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

interface UploadedFileFields {
  questionImage?: Express.Multer.File[];
  revealImage?: Express.Multer.File[];
}

@Injectable()
export class QuestionsService {
  private dynamodb: DynamoDBDocumentClient;
  private s3: S3Client;
  private questionsTable: string;
  private imagesBucket: string;

  constructor(private configService: ConfigService) {
    const client = new DynamoDBClient({});
    this.dynamodb = DynamoDBDocumentClient.from(client);
    this.s3 = new S3Client({});
    this.questionsTable = this.configService.get<string>('QUESTIONS_TABLE');
    this.imagesBucket = this.configService.get<string>('IMAGES_BUCKET');
  }

  async createQuestion(
    body: { question: string; answer: string },
    files: UploadedFileFields,
  ) {
    const id = uuidv4();
    const questionImageUrl = files.questionImage ? await this.uploadToS3(files.questionImage[0], `questions/${id}-question`) : null;
    const revealImageUrl = files.revealImage ? await this.uploadToS3(files.revealImage[0], `questions/${id}-reveal`) : null;

    const question = {
      id,
      question: body.question,
      answer: body.answer,
      questionImageUrl,
      revealImageUrl,
      createdAt: new Date().toISOString(),
    };

    await this.dynamodb.send(new PutCommand({
      TableName: this.questionsTable,
      Item: question,
    }));

    return question;
  }

  async updateQuestion(
    id: string,
    body: { question?: string; answer?: string },
    files: UploadedFileFields,
  ) {
    const existing = await this.getQuestion(id);
    if (!existing) {
      throw new Error('Question not found');
    }

    const questionImageUrl = files.questionImage ? await this.uploadToS3(files.questionImage[0], `questions/${id}-question`) : existing.questionImageUrl;
    const revealImageUrl = files.revealImage ? await this.uploadToS3(files.revealImage[0], `questions/${id}-reveal`) : existing.revealImageUrl;

    const updated = {
      ...existing,
      question: body.question || existing.question,
      answer: body.answer || existing.answer,
      questionImageUrl,
      revealImageUrl,
      updatedAt: new Date().toISOString(),
    };

    await this.dynamodb.send(new PutCommand({
      TableName: this.questionsTable,
      Item: updated,
    }));

    return updated;
  }

  async deleteQuestion(id: string) {
    const question = await this.getQuestion(id);
    if (!question) {
      throw new Error('Question not found');
    }

    if (question.questionImageUrl) {
      const key = question.questionImageUrl.split('.amazonaws.com/')[1];
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.imagesBucket,
        Key: key,
      }));
    }

    if (question.revealImageUrl) {
      const key = question.revealImageUrl.split('.amazonaws.com/')[1];
      await this.s3.send(new DeleteObjectCommand({
        Bucket: this.imagesBucket,
        Key: key,
      }));
    }

    await this.dynamodb.send(new DeleteCommand({
      TableName: this.questionsTable,
      Key: { id },
    }));

    return { message: 'Question deleted successfully' };
  }

  async getQuestion(id: string) {
    const result = await this.dynamodb.send(new GetCommand({
      TableName: this.questionsTable,
      Key: { id },
    }));

    return result.Item;
  }

  async getAllQuestions(limit: number = 30, lastEvaluatedKey?: Record<string, any>) {
    const result = await this.dynamodb.send(new ScanCommand({
      TableName: this.questionsTable,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    }));

    return {
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
      count: result.Count,
    };
  }

  async getRandomQuestions(count: number) {
    const result = await this.dynamodb.send(new ScanCommand({
      TableName: this.questionsTable,
    }));
    const allQuestions = result.Items || [];
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private async uploadToS3(file: Express.Multer.File, key: string): Promise<string> {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Only JPG and PNG images are allowed');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }

    const extension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const contentType = file.mimetype === 'image/png' ? 'image/png' : 'image/jpeg';
    const fullKey = `${key}.${extension}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.imagesBucket,
      Key: fullKey,
      Body: file.buffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
    }));

    return `https://${this.imagesBucket}.s3.amazonaws.com/${fullKey}`;
  }
}