import type { IAdminAccessProfile } from "@/types/accessProfile";
import type { IFile } from "@/types/file";

export interface IAdminAccountPhone {
  label: string;
  value: string;
}

export interface IAdminAccount {
  _id: string;
  name: string;
  emailAccess: string;
  phones?: IAdminAccountPhone[];
  active: boolean;
  bornDate?: string | null;
  image?: IFile;
  adminAccessProfile: string | IAdminAccessProfile;
  createdAtDateTime?: string;
  updatedAtDateTime?: string;
}

export type AdminAccountPayload = {
  name: string;
  emailAccess: string;
  passwordAccess?: string;
  phones: IAdminAccountPhone[];
  active: boolean;
  bornDate?: string | null;
  adminAccessProfile: string;
};

export function adminAccessProfileId(
  profile: string | IAdminAccessProfile | undefined | null
): string {
  if (!profile) return "";
  if (typeof profile === "string") return profile;
  return profile._id ?? "";
}

export function adminAccessProfileName(
  profile: string | IAdminAccessProfile | undefined | null
): string {
  if (!profile) return "Sem perfil";
  if (typeof profile === "string") return "Perfil";
  return profile.name || "Perfil";
}
