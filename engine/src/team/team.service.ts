import { Injectable } from '@nestjs/common';
import { generateTeam } from '../engine/utils/teamGenerator';
import { GenerateTeamDto } from './team.dto';
import { PrismaService } from '../prisma/prisma.service';

export interface TeamRiderDto {
  id: string;
  name: string;
  nationality?: string;
  stats: Record<string, number>;
}

export interface TeamDto {
  id: string;
  name: string;
  townName?: string | null;
  managerName?: string | null;
  riders: TeamRiderDto[];
}

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(dto: GenerateTeamDto, userId: string): Promise<TeamDto> {
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
      this.prisma.user.update({
        where: { id: userId },
        data: { teamId: team.id },
      }),
    ]);

    return {
      id: team.id,
      name: team.name,
      townName: dto.townName,
      managerName: dto.managerName,
      riders: team.riders.map((r) => ({
        id: r.id,
        name: r.name,
        nationality: r.nationality,
        stats: r.stats,
      })),
    };
  }

  async findMyTeam(userId: string): Promise<TeamDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { teamId: true },
    });
    if (!user?.teamId) return null;

    const team = await this.prisma.team.findUnique({
      where: { id: user.teamId },
      include: { cyclists: true },
    });
    if (!team) return null;

    return {
      id: team.id,
      name: team.name,
      townName: team.townName,
      managerName: team.managerName,
      riders: team.cyclists.map((c) => ({
        id: c.id,
        name: c.name,
        stats: {
          stamina: c.stamina,
          performance: c.performance,
          climbing: c.climbing,
          sprint: c.sprint,
          vigilance: c.vigilance,
          resistance: c.resistance,
          recovery: c.recovery,
        },
      })),
    };
  }
}
