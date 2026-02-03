import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { IotModule } from '../iot/iot.module';

@Module({
  imports: [IotModule],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}