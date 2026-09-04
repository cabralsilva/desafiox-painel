import type { Modality } from "./team";

export type GroupMatchMode = "SAME_GROUP" | "OTHER_GROUPS";
export type QualificationMode = "POSITION_INTO_GROUP" | "POSITION_GENERAL";
export type PhaseType = "MATA-MATA" | "GRUPOS" | "PONTOS-CORRIDOS";

export const GROUP_MATCH_MODE_LABELS: Record<GroupMatchMode, string> = {
  SAME_GROUP: "Times do mesmo grupo se enfrentam",
  OTHER_GROUPS: "Grupo enfrenta outro grupo",
};

export const QUALIFICATION_MODE_LABELS: Record<QualificationMode, string> = {
  POSITION_INTO_GROUP: "Posição dentro do grupo",
  POSITION_GENERAL: "Posição na classificação geral",
};

export const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  "MATA-MATA": "Mata-mata",
  GRUPOS: "Grupos",
  "PONTOS-CORRIDOS": "Pontos corridos",
};

export interface MatchRules {
  mode: GroupMatchMode;
  twoLegs: boolean;
}

export interface QualifiedRule {
  priority: number;
  mode: QualificationMode;
  position: number;
  limit: number;
  label?: string;
}

export interface QualifiedSlot {
  label: string;
  team: string | null;
  priority: number;
  position: number;
  group: string;
}

export interface GroupSlot {
  label: string;
  team: string | null;
}

export interface PhaseGroup {
  name: string;
  slots: GroupSlot[];
}

export interface ChampionshipPhase {
  id?: string;
  championshipId?: string;
  description: string;
  order: number;
  type?: PhaseType;
  amountSlotsByGroup?: number;
  groups: PhaseGroup[];
  matchRules: MatchRules;
  qualifiedRules: QualifiedRule[];
  qualifiedsSlots?: QualifiedSlot[];
}

export interface ChampionshipTeam {
  id: string;
  name: string;
  shortName?: string;
  image?: { url?: string };
}

export interface Championship {
  id: string;
  name: string;
  slug?: string;
  startDate?: string;
  endDate?: string;
  teamIds: string[];
  teams?: ChampionshipTeam[];
  modality: Modality;
}

export type RoundStatus =
  | "CANCELLED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "IN_HOMOLOGATION"
  | "FINISHED"
  | "NOT_PLAYED";

export const ROUND_STATUS_LABELS: Record<string, string> = {
  CANCELLED: "Cancelada",
  SCHEDULED: "Agendada",
  IN_PROGRESS: "Em andamento",
  IN_HOMOLOGATION: "Em homologação",
  FINISHED: "Encerrada",
  NOT_PLAYED: "Não iniciada",
};

export type MatchStatus =
  | "PENDING"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export const MATCH_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em jogo",
  FINISHED: "Encerrado",
  POSTPONED: "Adiado",
  CANCELLED: "Cancelado",
};
