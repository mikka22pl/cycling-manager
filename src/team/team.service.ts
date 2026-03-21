import { Injectable } from '@nestjs/common';
import { generateTeam } from '../engine/utils/teamGenerator';
import { GenerateTeamDto } from './team.dto';
import { TeamWithRiders } from '../engine/models/team';

@Injectable()
export class TeamService {
  generate(dto: GenerateTeamDto): TeamWithRiders {
    return generateTeam({ name: dto.name });
  }
}
