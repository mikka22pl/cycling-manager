import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { RaceService } from './race.service';
import { CreateRaceDto, CreateSimpleRaceDto, SimulateRaceDto, AddSegmentsDto, RegisterForRaceDto } from './race.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/current-user.decorator';

@Controller('race')
export class RaceController {
  constructor(private readonly raceService: RaceService) {}

  /** List all races (summary). */
  @Get()
  listRaces() {
    return this.raceService.listRaces();
  }

  /**
   * Create a minimal race (name + season only). No segments or teams yet.
   * Returns the race record (status: PENDING).
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createSimpleRace(@Body() dto: CreateSimpleRaceDto) {
    return this.raceService.createSimpleRace(dto);
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
   * Append segments to a PENDING race.
   * Each segment specifies distance (km), type, and gradient.
   * startKm/endKm are computed automatically; totalDistance is updated.
   */
  @Post(':id/segments')
  @HttpCode(HttpStatus.CREATED)
  addSegments(@Param('id') id: string, @Body() dto: AddSegmentsDto) {
    return this.raceService.addSegments(id, dto);
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

  /** Startlist: all registered cyclists grouped by team. */
  @Get(':id/startlist')
  getStartlist(@Param('id') id: string) {
    return this.raceService.getStartlist(id);
  }

  /** Close the startlist: assign start numbers and transition OPEN → PENDING. */
  @Post(':id/close-startlist')
  @HttpCode(HttpStatus.OK)
  closeStartlist(@Param('id') id: string) {
    return this.raceService.closeStartlist(id);
  }

  /** Register the authenticated user's cyclists for a race. */
  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  @HttpCode(HttpStatus.OK)
  registerForRace(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterForRaceDto,
  ) {
    return this.raceService.registerForRace(user.sub, id, dto);
  }

  /** Get the authenticated user's race entries for a given race. */
  @UseGuards(JwtAuthGuard)
  @Get(':id/my-entries')
  getMyEntries(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.raceService.getMyRaceEntries(user.sub, id);
  }
}
