import type { IAdminAccount } from "@/types/adminAccount";
import type { IFile } from "@/types/file";

/** Espelha `IContact` de c2-desafiox. */
export interface IContact {
  _id?: string;
  account?: string;
  adminAccount?: string | IAdminAccount;
  identifier: string;
  name: string;
  profilePhoto?: IFile;
  createdAtDateTime?: string;
  updatedAtDateTime?: string;
}

export type CreateContactPayload = Omit<
  IContact,
  "_id" | "adminAccount" | "createdAtDateTime" | "updatedAtDateTime"
>;
