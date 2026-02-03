import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationQueryDto, PaginationResponseDto } from './pagination.dto';

interface UploadedFileFields {
  questionImage?: Express.Multer.File[];
  revealImage?: Express.Multer.File[];
}

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAllQuestions(@Query() query: PaginationQueryDto) {
    const limit = query.limit ? Number(query.limit) : 30;
    const lastEvaluatedKey = query.lastKey 
      ? JSON.parse(decodeURIComponent(Buffer.from(query.lastKey, 'base64').toString()))
      : undefined;
    
    const result = await this.questionsService.getAllQuestions(limit, lastEvaluatedKey);
    return new PaginationResponseDto(result.items, result.count, result.lastEvaluatedKey);
  }

  @Get('random/:count')
  getRandomQuestions(@Param('count') count: string) {
    return this.questionsService.getRandomQuestions(parseInt(count));
  }

  @Get(':id')
  getQuestion(@Param('id') id: string) {
    return this.questionsService.getQuestion(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'questionImage', maxCount: 1 },
    { name: 'revealImage', maxCount: 1 },
  ]))
  createQuestion(
    @Body() body: { question: string; answer: string },
    @UploadedFiles() files: UploadedFileFields,
  ) {
    return this.questionsService.createQuestion(body, files);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'questionImage', maxCount: 1 },
    { name: 'revealImage', maxCount: 1 },
  ]))
  updateQuestion(
    @Param('id') id: string,
    @Body() body: { question?: string; answer?: string },
    @UploadedFiles() files: UploadedFileFields,
  ) {
    return this.questionsService.updateQuestion(id, body, files);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteQuestion(@Param('id') id: string) {
    return this.questionsService.deleteQuestion(id);
  }
}