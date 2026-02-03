import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('session')
  createSession(@Body() createSessionDto: any) {
    return this.gameService.createSession(createSessionDto);
  }

  @Get('session/:sessionId')
  getSession(@Param('sessionId') sessionId: string) {
    return this.gameService.getSession(sessionId);
  }

  @Post('session/:sessionId/join')
  joinSession(@Param('sessionId') sessionId: string, @Body() joinDto: any) {
    return this.gameService.joinSession(sessionId, joinDto);
  }

  @Post('session/:sessionId/answer')
  submitAnswer(@Param('sessionId') sessionId: string, @Body() answerDto: any) {
    return this.gameService.submitAnswer(sessionId, answerDto);
  }

  @Get('session/:sessionId/reveal/:userId/:questionId')
  getReveal(
    @Param('sessionId') sessionId: string,
    @Param('userId') userId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.gameService.getReveal(sessionId, userId, questionId);
  }

  @Get('session/:sessionId/leaderboard')
  getLeaderboard(@Param('sessionId') sessionId: string) {
    return this.gameService.getLeaderboard(sessionId);
  }

  @Post('session/:sessionId/start')
  startGame(@Param('sessionId') sessionId: string) {
    return this.gameService.startGame(sessionId);
  }

  @Post('session/:sessionId/restart')
  restartGame(@Param('sessionId') sessionId: string) {
    return this.gameService.restartGame(sessionId);
  }

  @Get('session/:sessionId/current-question')
  getCurrentQuestion(@Param('sessionId') sessionId: string) {
    return this.gameService.getCurrentQuestion(sessionId);
  }

  @Get('session/:sessionId/round/:round')
  getRoundQuestion(
    @Param('sessionId') sessionId: string,
    @Param('round') round: string,
  ) {
    return this.gameService.getRoundQuestion(sessionId, parseInt(round));
  }
}