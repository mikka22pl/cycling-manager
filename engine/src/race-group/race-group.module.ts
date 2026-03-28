import { Module } from '@nestjs/common';
import { RaceGroupController } from './race-group.controller';
import { RaceGroupService } from './race-group.service';

@Module({
  controllers: [RaceGroupController],
  providers: [RaceGroupService],
})
export class RaceGroupModule {}
