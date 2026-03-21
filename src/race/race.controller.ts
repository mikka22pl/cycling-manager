import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RaceService } from './race.service';
import { CreateRaceDto, SimulateRaceDto } from './race.dto';

@Controller('race')
export class RaceController {
  constructor(private readonly raceService: RaceService) {}

  /** List all races (summary). */
  @Get()
  listRaces() {
    return this.raceService.listRaces();
  }

  /**
   * Create a new race with cyclists, teams, and segments.
   * Returns the race object (status: PENDING) including its id.
   */
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  createRace(@Body() dto: CreateRaceDto) {
    return this.raceService.createRace(dto);
  }

  /** Get a single race (full state). */
  @Get(':id')
  getRace(@Param('id') id: string) {
    return this.raceService.getRace(id);
  }

  /**
   * Run the simulation for a race.
   * Returns the finished race object including all snapshots.
   */
  @Post(':id/simulate')
  @HttpCode(HttpStatus.OK)
  simulate(@Param('id') id: string, @Body() dto?: SimulateRaceDto) {
    return this.raceService.simulate(id, dto);
  }

  /** Get all snapshots for a finished race. */
  @Get(':id/snapshots')
  getSnapshots(@Param('id') id: string) {
    return this.raceService.getSnapshots(id);
  }

  /**
   * Get the snapshot at a specific km mark.
   * Query param: ?km=50
   */
  @Get(':id/snapshots/at')
  getSnapshotAt(
    @Param('id') id: string,
    @Query('km') km: string,
  ) {
    return this.raceService.getSnapshot(id, parseFloat(km));
  }

  /** Final leaderboard (sorted by position). */
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.raceService.getLeaderboard(id);
  }
}
