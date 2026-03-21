import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { GenerateTeamDto } from './team.dto';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  /**
   * Generate a full 9-rider team with randomly assigned stats.
   * Team name is optional — one will be generated if omitted.
   */
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  generate(@Body() dto: GenerateTeamDto) {
    return this.teamService.generate(dto);
  }
}
