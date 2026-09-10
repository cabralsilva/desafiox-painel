export interface IAdminAccessProfile {
  _id: string;
  name: string;
  roles: string[];
  active: boolean;
  createdAtDateTime?: string;
  updatedAtDateTime?: string;
}

export type AccessProfilePayload = {
  name: string;
  roles: string[];
  active: boolean;
};
