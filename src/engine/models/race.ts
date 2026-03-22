import { Cyclist } from './cyclist';
import { Segment } from './segment';
import { Team } from './team';

export type RaceSnapshot = {
  km: number;
  cyclists: {
    id: string;
    name: string;
    teamId: string;
    position: number;
    speed: number;
    energy: number;
    intent?: string;
    groupId?: string;
    isDropped: boolean;
    finishPosition?: number;
  }[];
};

export type RaceStatus = 'PENDING' | 'RUNNING' | 'FINISHED';

export type Race = {
  id: string;
  name: string;
  totalDistance: number;
  segments: Segment[];
  teams: Team[];
  cyclists: Cyclist[];
  snapshots: RaceSnapshot[];
  status: RaceStatus;
  seed?: number;
  createdAt: string;
  finishedAt?: string;
};
