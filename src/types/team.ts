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

export interface TeamImage {
  contentType?: string;
  format?: string;
  description?: string;
  url?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  image?: TeamImage;
  modality: Modality;
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
