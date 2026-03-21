import { Module } from '@nestjs/common';
import { RaceModule } from './race/race.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [RaceModule, TeamModule],
})
export class AppModule {}
