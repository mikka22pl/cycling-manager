import { Module } from '@nestjs/common';
import { RaceController } from './race.controller';
import { RaceService } from './race.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Module({
  controllers: [RaceController],
  providers: [RaceService, JwtAuthGuard],
})
export class RaceModule {}
