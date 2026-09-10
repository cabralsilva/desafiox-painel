import { ITeam } from "./team";

export interface ISlots {
  _id: string;
  label: string;
  team: ITeam | string | null;
}
