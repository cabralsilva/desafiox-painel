import { IChampionship } from "./championship";
import { ISlots } from "./slot";


export enum GroupMatchModeTranslation {
  SAME_GROUP = "Times do mesmo grupo se enfrentam",
  OTHER_GROUPS = "Grupo enfrenta outro grupo",
}


export enum QualificationModeTranslation {
  POSITION_INTO_GROUP = "Posição dentro do grupo",
  POSITION_GENERAL = "Posição na classificação geral",
}


export enum PhaseTypeTranslation {
  MATA_MATA = "Mata-mata",
  GRUPOS = "Grupos",
  PONTOS_CORRIDOS = "Pontos corridos",
}

export enum GroupMatchMode {
  SAME_GROUP = "SAME_GROUP",
  OTHER_GROUPS = "OTHER_GROUPS"
}

export interface IGroup {
  name: string;
  slots: ISlots[];
}

export interface IMatchRules {
  mode: GroupMatchMode;
  twoLegs: boolean;
}

export interface IQualifiedsSlots extends ISlots {
  priority: number;
  position: number;
  group?: string;
}

export enum QualificationMode {
  POSITION_INTO_GROUP = "POSITION_INTO_GROUP",
  POSITION_GENERAL = "POSITION_GENERAL",
}

export interface IQualifiedRule {
  priority: number;
  mode: QualificationMode;
  position: number;
  limit: number;
  label: string;
}

export interface IChampionshipPhase {
  _id: string;
  description: string;
  championship: string | IChampionship;
  order: number;
  matchRules?: IMatchRules;

  amountSlotsByGroup: number;
  groups: IGroup[];

  qualifiedRules: IQualifiedRule[];
  qualifiedsSlots: IQualifiedsSlots[];

  createdAtDateTime: Date;
  updatedAtDateTime: Date;
}