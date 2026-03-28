import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RaceGroupService } from './race-group.service';
import { CreateRaceGroupDto } from './race-group.dto';

@Controller('race-group')
export class RaceGroupController {
  constructor(private readonly raceGroupService: RaceGroupService) {}

  /** Create a staged race (race group + stage race records). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createRaceGroup(@Body() dto: CreateRaceGroupDto) {
    return this.raceGroupService.createRaceGroup(dto);
  }
}
