import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class GameService {
  private dynamodb: DynamoDBDocumentClient;
  private gameSessionsTable: string;
  private questionsTable: string;

  constructor(private configService: ConfigService) {
    const client = new DynamoDBClient({});
    this.dynamodb = DynamoDBDocumentClient.from(client);
    this.gameSessionsTable = this.configService.get<string>('GAMES_TABLE');
    this.questionsTable = this.configService.get<string>('QUESTIONS_TABLE');
  }

  async createSession(createSessionDto: any) {
    const sessionId = this.generateSessionId();
    const totalRounds = createSessionDto.totalRounds || 5;
    const creatorId = createSessionDto.creatorId;
    
    const questions = await this.getRandomQuestions(totalRounds);
    const questionIds = questions.map(q => q.id);
    
    const session = {
      sessionId,
      userId: 'session',
      createdAt: new Date().toISOString(),
      status: 'waiting',
      currentRound: 0,
      totalRounds,
      players: [],
      questionIds,
      creatorId,
    };

    await this.dynamodb.send(new PutCommand({
      TableName: this.gameSessionsTable,
      Item: session,
    }));

    return { sessionId, ...session };
  }

  async getSession(sessionId: string) {
    const result = await this.dynamodb.send(new QueryCommand({
      TableName: this.gameSessionsTable,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
    }));

    return result.Items;
  }

  async joinSession(sessionId: string, joinDto: any) {
    const { userId, username } = joinDto;
    
    const player = {
      sessionId,
      userId,
      username,
      score: 0,
      answers: [],
      joinedAt: new Date().toISOString(),
    };

    await this.dynamodb.send(new PutCommand({
      TableName: this.gameSessionsTable,
      Item: player,
    }));

    // Update session's players array
    await this.dynamodb.send(new UpdateCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId: 'session' },
      UpdateExpression: 'SET players = list_append(if_not_exists(players, :empty), :player)',
      ExpressionAttributeValues: {
        ':player': [{ userId, username }],
        ':empty': [],
      },
    }));

    return { message: 'Joined session successfully', player };
  }

  async submitAnswer(sessionId: string, answerDto: any) {
    const { userId, questionId, answer } = answerDto;
    
    // Get the question to check correct answer
    const question = await this.getQuestion(questionId);
    
    console.log('Submit Answer Debug:', {
      userAnswer: answer,
      userAnswerLower: answer.toLowerCase().trim(),
      correctAnswer: question.answer,
      correctAnswerLower: question.answer.toLowerCase().trim(),
      questionId,
    });
    
    const isCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
    const points = isCorrect ? 100 : 0;
    
    // Create answer record
    const answerRecord = {
      questionId,
      answer,
      correct: isCorrect,
      points,
      answeredAt: new Date().toISOString(),
    };
    
    // Append answer to answers array and update score
    await this.dynamodb.send(new UpdateCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId },
      UpdateExpression: 'SET answers = list_append(if_not_exists(answers, :empty), :answer), score = score + :points',
      ExpressionAttributeValues: {
        ':answer': [answerRecord],
        ':points': points,
        ':empty': [],
      },
    }));

    return { submitted: true, correct: isCorrect, points };
  }

  async getReveal(sessionId: string, userId: string, questionId: string) {
    // Get player data
    const player = await this.dynamodb.send(new GetCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId },
    }));

    // Get question data
    const question = await this.getQuestion(questionId);

    // Find the LAST answer for this specific question (if exists)
    const answers = player.Item?.answers?.filter(a => a.questionId === questionId) || [];
    const userAnswerRecord = answers[answers.length - 1];

    // If no answer submitted, treat as empty/wrong answer
    const userAnswer = userAnswerRecord?.answer || null;
    const isCorrect = userAnswerRecord?.correct || false;
    const points = userAnswerRecord?.points || 0;

    return {
      correctAnswer: question.answer,
      revealImageUrl: question.revealImageUrl,
      userAnswer,
      correct: isCorrect,
      points,
      currentScore: player.Item?.score || 0,
    };
  }

  async getLeaderboard(sessionId: string) {
    const result = await this.dynamodb.send(new QueryCommand({
      TableName: this.gameSessionsTable,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
    }));

    const players = (result.Items || []).filter(item => item.userId !== 'session');
    
    // Add stats for each player
    const playersWithStats = players.map(player => {
      const answers = player.answers || [];
      return {
        sessionId: player.sessionId,
        userId: player.userId,
        username: player.username,
        score: player.score || 0,
        totalAnswers: answers.length,
        correctAnswers: answers.filter(a => a.correct).length,
        joinedAt: player.joinedAt,
      };
    });
    
    return playersWithStats.sort((a, b) => b.score - a.score);
  }

  async startGame(sessionId: string) {
    await this.dynamodb.send(new UpdateCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId: 'session' },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'playing',
      },
    }));

    return { message: 'Game started' };
  }

  async restartGame(sessionId: string) {
    const session = await this.dynamodb.send(new GetCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId: 'session' },
    }));

    const totalRounds = session.Item?.totalRounds || 5;
    const questions = await this.getRandomQuestions(totalRounds);
    const questionIds = questions.map(q => q.id);

    await this.dynamodb.send(new UpdateCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId: 'session' },
      UpdateExpression: 'SET #status = :status, questionIds = :qids, currentRound = :round',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'waiting',
        ':qids': questionIds,
        ':round': 0,
      },
    }));

    const result = await this.dynamodb.send(new QueryCommand({
      TableName: this.gameSessionsTable,
      KeyConditionExpression: 'sessionId = :sessionId',
      ExpressionAttributeValues: {
        ':sessionId': sessionId,
      },
    }));

    const players = (result.Items || []).filter(item => item.userId !== 'session');
    
    for (const player of players) {
      await this.dynamodb.send(new UpdateCommand({
        TableName: this.gameSessionsTable,
        Key: { sessionId, userId: player.userId },
        UpdateExpression: 'SET answers = :empty, score = :zero',
        ExpressionAttributeValues: {
          ':empty': [],
          ':zero': 0,
        },
      }));
    }

    return { message: 'Game restarted' };
  }

  async getCurrentQuestion(sessionId: string) {
    const session = await this.dynamodb.send(new GetCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId: 'session' },
    }));

    const currentRound = session.Item?.currentRound || 1;
    const questionIds = session.Item?.questionIds || [];
    const questionId = questionIds[currentRound - 1];

    if (!questionId) {
      return { finished: true, message: 'Game completed' };
    }

    const question = await this.getQuestion(questionId);
    return { currentRound, totalRounds: questionIds.length, question };
  }

  async getRoundQuestion(sessionId: string, round: number) {
    const session = await this.dynamodb.send(new GetCommand({
      TableName: this.gameSessionsTable,
      Key: { sessionId, userId: 'session' },
    }));

    const questionIds = session.Item?.questionIds || [];
    const questionId = questionIds[round - 1];

    if (!questionId) {
      return null;
    }

    return await this.getQuestion(questionId);
  }

  private async getQuestion(questionId: string) {
    const result = await this.dynamodb.send(new GetCommand({
      TableName: this.questionsTable,
      Key: { id: questionId },
    }));
    return result.Item;
  }

  private async getRandomQuestions(count: number) {
    const result = await this.dynamodb.send(new ScanCommand({
      TableName: this.questionsTable,
    }));
    const allQuestions = result.Items || [];
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}