import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { SeasonService } from './season.service';
import { CreateSeasonDto } from './season.dto';

@Controller('season')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  /** List all seasons. */
  @Get()
  listSeasons() {
    return this.seasonService.listSeasons();
  }

  /** Get the current season (status = CURRENT), or null if none/ambiguous. */
  @Get('current')
  getCurrentSeason() {
    return this.seasonService.getCurrentSeason();
  }

  /** Create a new season. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSeason(@Body() dto: CreateSeasonDto) {
    return this.seasonService.createSeason(dto);
  }

  /** Get a season with its races and winners. */
  @Get(':id')
  getSeason(@Param('id') id: string) {
    return this.seasonService.getSeason(id);
  }
}
