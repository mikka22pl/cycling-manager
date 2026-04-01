import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSeasonDto,
  SeasonDetailDto,
  SeasonRaceDto,
  SeasonSummary,
  WinnerDto,
} from './season.dto';

@Injectable()
export class SeasonService {
  constructor(private readonly prisma: PrismaService) {}

  async createSeason(dto: CreateSeasonDto): Promise<SeasonSummary> {
    const existing = await this.prisma.season.findUnique({
      where: { year: dto.year },
    });
    if (existing) {
      throw new ConflictException(`Season for year ${dto.year} already exists.`);
    }

    const season = await this.prisma.season.create({
      data: { year: dto.year },
      include: { _count: { select: { races: true } } },
    });

    return {
      id: season.id,
      year: season.year,
      raceCount: season._count.races,
      createdAt: season.createdAt,
    };
  }

  async getCurrentSeason(): Promise<SeasonSummary | null> {
    const seasons = await this.prisma.season.findMany({
      where: { status: 'CURRENT' },
      include: { _count: { select: { races: true } } },
    });
    if (seasons.length !== 1) return null;
    const s = seasons[0];
    return { id: s.id, year: s.year, raceCount: s._count.races, createdAt: s.createdAt };
  }

  async listSeasons(): Promise<SeasonSummary[]> {
    const seasons = await this.prisma.season.findMany({
      include: { _count: { select: { races: true } } },
      orderBy: { year: 'desc' },
    });

    return seasons.map((s) => ({
      id: s.id,
      year: s.year,
      raceCount: s._count.races,
      createdAt: s.createdAt,
    }));
  }

  async getSeason(id: string): Promise<SeasonDetailDto> {
    const season = await this.prisma.season.findUnique({
      where: { id },
      include: {
        races: {
          include: { raceGroup: true },
          orderBy: [{ raceGroupId: 'asc' }, { stageNumber: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!season) throw new NotFoundException(`Season ${id} not found.`);

    const races: SeasonRaceDto[] = await Promise.all(
      season.races.map(async (race) => {
        const winner = race.status === 'FINISHED' ? await this.resolveWinner(race.id) : null;
        return {
          id: race.id,
          name: race.name,
          raceType: race.raceType,
          totalDistance: race.totalDistance,
          stageNumber: race.stageNumber,
          raceGroupId: race.raceGroupId,
          raceGroupName: race.raceGroup?.name ?? null,
          status: race.status,
          winner,
        };
      }),
    );

    return {
      id: season.id,
      year: season.year,
      createdAt: season.createdAt,
      races,
    };
  }

  private async resolveWinner(raceId: string): Promise<WinnerDto | null> {
    const lastSnapshot = await this.prisma.raceSnapshot.findFirst({
      where: { raceId },
      orderBy: { km: 'desc' },
      include: {
        cyclistSnapshots: {
          where: { finishPosition: 1 },
          include: { cyclist: { include: { team: true } } },
          take: 1,
        },
      },
    });

    const cs = lastSnapshot?.cyclistSnapshots[0];
    if (!cs) return null;

    return {
      id: cs.cyclist.id,
      name: cs.cyclist.name,
      teamName: cs.cyclist.team.name,
    };
  }
}
