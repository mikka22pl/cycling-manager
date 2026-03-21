import { Cyclist } from './cyclist';

export type TeamStrategy =
  | 'GENERAL_CLASSIFICATION'
  | 'SPRINT_STAGE'
  | 'BREAKAWAY'
  | 'BALANCED';

export type Team = {
  id: string;
  name: string;
  leaderId: string;
  domestiqueIds: string[];
  strategy: TeamStrategy;
};

/** Team as it appears in a Race (riders resolved from cyclists array) */
export type TeamWithRiders = Team & {
  riders: Cyclist[];
};
