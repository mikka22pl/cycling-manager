import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRaceGroupDto, RaceGroupResult } from './race-group.dto';

@Injectable()
export class RaceGroupService {
  constructor(private readonly prisma: PrismaService) {}

  async createRaceGroup(dto: CreateRaceGroupDto): Promise<RaceGroupResult> {
    if (!dto.stages || dto.stages.length < 2) {
      throw new BadRequestException('A staged race must have at least 2 stages.');
    }

    const season = await this.prisma.season.findUnique({
      where: { id: dto.seasonId },
    });
    if (!season) {
      throw new NotFoundException(`Season ${dto.seasonId} not found.`);
    }

    const raceGroup = await this.prisma.raceGroup.create({
      data: {
        name: dto.name,
        seasonId: dto.seasonId,
        stages: {
          create: dto.stages.map((stage, index) => ({
            name: stage.name,
            totalDistance: 0,
            raceType: 'STAGE',
            stageNumber: index + 1,
            seasonId: dto.seasonId,
          })),
        },
      },
      include: { _count: { select: { stages: true } } },
    });

    return {
      id: raceGroup.id,
      name: raceGroup.name,
      seasonId: raceGroup.seasonId,
      createdAt: raceGroup.createdAt,
      stageCount: raceGroup._count.stages,
    };
  }
}
