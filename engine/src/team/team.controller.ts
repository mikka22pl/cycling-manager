import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { GenerateTeamDto } from './team.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() dto: GenerateTeamDto, @CurrentUser() user: JwtPayload) {
    return this.teamService.generate(dto, user.sub);
  }

  @Get('my')
  async getMyTeam(@CurrentUser() user: JwtPayload) {
    const team = await this.teamService.findMyTeam(user.sub);
    if (!team) throw new NotFoundException('No team found');
    return team;
  }
}
