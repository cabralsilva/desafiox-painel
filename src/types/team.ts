import { IFile } from "./file";

export type Modality =
  | "SOCCER"
  | "BASKETBALL"
  | "TENNIS"
  | "VOLLEYBALL"
  | "HANDBALL"
  | "GOLF"
  | "BASEBALL"
  | "HOCKEY"
  | "AMERICAN_FOOTBALL"
  | "RUGBY";

export interface ITeam {
  _id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  image?: IFile
  externalId?: string;
  modality: Modality;
  createdAtDateTime: Date;
  updatedAtDateTime: Date;
}

export const MODALITY_LABELS: Record<Modality, string> = {
  SOCCER: "Futebol",
  BASKETBALL: "Basquete",
  TENNIS: "Tênis",
  VOLLEYBALL: "Vôlei",
  HANDBALL: "Handebol",
  GOLF: "Golfe",
  BASEBALL: "Beisebol",
  HOCKEY: "Hóquei",
  AMERICAN_FOOTBALL: "Futebol Americano",
  RUGBY: "Rugby",
};

export const MODALITIES = Object.keys(MODALITY_LABELS) as Modality[];
