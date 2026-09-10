import { IChampionship } from "./championship";
import { IChampionshipPhase } from "./championship-phase";

export enum RoundStatusTranslation {
  CANCELLED = "Cancelada",
  SCHEDULED = "Agendada",
  IN_PROGRESS = "Em andamento",
  IN_HOMOLOGATION = "Em homologação",
  FINISHED = "Encerrada",
  NOT_PLAYED = "Não iniciada",
}

export enum RoundStatus {
  CANCELLED = "CANCELLED",
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  IN_HOMOLOGATION = "IN_HOMOLOGATION",
  FINISHED = "FINISHED"
}

export interface IChampionshipRound {
  _id: string;
  phase: string | IChampionshipPhase;
  championship: string | IChampionship;
  roundIndexInPhase: number;
  globalRoundIndex: number;
  label?: string;
  startDate?: Date;
  endDate?: Date;
  status: RoundStatus;
  createdAtDateTime: Date;
  updatedAtDateTime: Date;
}