import { IChampionship } from "./championship";
import { ISlots } from "./slot";
import { IChampionshipPhase } from "./championship-phase";
import { ITeam } from "./team";

export interface IChampionshipClassification {
  _id: string;

  slot: string | ISlots;
  championship: string | IChampionship;
  phase: string | IChampionshipPhase;

  team: string | ITeam;
  group: string;

  matchesPlayed: number;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;

  createdAtDateTime: Date;
  updatedAtDateTime: Date;
}