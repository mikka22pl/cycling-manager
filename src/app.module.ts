import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RaceModule } from './race/race.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [PrismaModule, RaceModule, TeamModule],
})
export class AppModule {}
