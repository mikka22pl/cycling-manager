import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RaceModule } from './race/race.module';
import { TeamModule } from './team/team.module';
import { SeasonModule } from './season/season.module';
import { RaceGroupModule } from './race-group/race-group.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, RaceModule, TeamModule, SeasonModule, RaceGroupModule, AuthModule],
})
export class AppModule {}
