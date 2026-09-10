import { IChampionship } from "./championship";
import { IChampionshipPhase } from "./championship-phase";
import { IChampionshipRound } from "./championship-round";
import { ISlots } from "./slot";



export enum MatchStatusTranslation {
  PENDING = "Pendente",
  SCHEDULED = "Agendado",
  IN_PROGRESS = "Em andamento",
  FINISHED = "Encerrado",
  POSTPONED = "Adiado",
  CANCELLED = "Cancelado",
}

export enum MatchStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  POSTPONED = "POSTPONED",
  CANCELLED = "CANCELLED"
}


export interface IMatch {
  _id: string;
  number: number;
  championship: string | IChampionship;
  phase: string | IChampionshipPhase;
  round: string | IChampionshipRound;
  group?: string;
  slotHome: ISlots;
  slotAway: ISlots;
  scheduledAt?: Date;
  homeScore?: number;
  homeScoreTieBreak?: number;
  awayScore?: number;
  awayScoreTieBreak?: number;
  status: MatchStatus;
  matchDateTime: Date;
  location: string;
  createdAtDateTime: Date;
  updatedAtDateTime: Date;
}