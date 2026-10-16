export type PhoneModelId = "iphone16pro" | "iphone15" | "s24ultra";
export type CaseTypeId = "silicone" | "hard" | "armor" | "wallet" | "magsafe";
export type FinishId = "matte" | "glossy" | "leather" | "transparent";

export interface PhoneModel {
  id: PhoneModelId;
  name: string;
  /** body size in scene units (1 unit = 10cm-ish) */
  width: number;
  height: number;
  depth: number;
  radius: number;
  price: number;
  camera: "triple" | "dual" | "quad";
}

export interface CaseType {
  id: CaseTypeId;
  name: string;
  description: string;
  price: number;
  /** extra thickness around the phone */
  thickness: number;
  /** corner bumper bulge */
  bumper: number;
  defaultFinish: FinishId;
}

export interface Finish {
  id: FinishId;
  name: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  transmission: number;
  opacity: number;
}
