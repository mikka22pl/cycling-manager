import { Injectable } from '@nestjs/common';
import { generateTeam } from '../engine/utils/teamGenerator';
import { GenerateTeamDto } from './team.dto';
import { TeamWithRiders } from '../engine/models/team';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(dto: GenerateTeamDto): Promise<TeamWithRiders> {
    const team = generateTeam({
      name: dto.name,
      numberOfRiders: Number(dto.numberOfRiders ?? 8),
      nationality: dto.nationality,
    });

    await this.prisma.$transaction([
      this.prisma.team.create({
        data: {
          id: team.id,
          name: team.name,
          townName: dto.townName,
          managerName: dto.managerName,
          strategy: team.strategy,
          leaderId: team.leaderId,
          domestiqueIds: team.domestiqueIds,
        },
      }),
      this.prisma.cyclist.createMany({
        data: team.riders.map((r) => ({
          id: r.id,
          name: r.name,
          teamId: team.id,
          stamina: r.stats.stamina,
          performance: r.stats.performance,
          climbing: r.stats.climbing,
          sprint: r.stats.sprint,
          vigilance: r.stats.vigilance,
          resistance: r.stats.resistance,
          recovery: r.stats.recovery,
        })),
      }),
    ]);

    return team;
  }
}
