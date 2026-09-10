import { Modality } from "./modality";
import { ITeam } from "./team";
export interface IChampionship {
  _id: string;
  name: string;
  slug?: string;
  startDate?: Date;
  endDate?: Date;
  teams: string[] | ITeam[];
  modality: Modality;
  createdAtDateTime: Date;
  updatedAtDateTime: Date;
}
