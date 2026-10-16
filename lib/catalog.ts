import type { CaseType, Finish, PhoneModel } from "./types";

export const PHONES: PhoneModel[] = [
  { id: "iphone16pro", name: "iPhone 16 Pro", width: 0.72, height: 1.49, depth: 0.083, radius: 0.12, price: 19, camera: "triple" },
  { id: "iphone15", name: "iPhone 15", width: 0.71, height: 1.47, depth: 0.078, radius: 0.12, price: 17, camera: "dual" },
  { id: "s24ultra", name: "Samsung S24 Ultra", width: 0.79, height: 1.62, depth: 0.086, radius: 0.07, price: 21, camera: "quad" },
];

export const CASE_TYPES: CaseType[] = [
  { id: "silicone", name: "Silicone", description: "Soft-touch & grippy", price: 14, thickness: 0.035, bumper: 0.01, defaultFinish: "matte" },
  { id: "hard", name: "Hard Plastic", description: "Slim & snappy", price: 12, thickness: 0.025, bumper: 0.005, defaultFinish: "glossy" },
  { id: "armor", name: "Tough Armor", description: "Dual-layer protection", price: 24, thickness: 0.06, bumper: 0.03, defaultFinish: "matte" },
  { id: "wallet", name: "Leather Wallet", description: "Folio with card slots", price: 32, thickness: 0.05, bumper: 0.015, defaultFinish: "leather" },
  { id: "magsafe", name: "MagSafe", description: "Magnetic ring built in", price: 28, thickness: 0.035, bumper: 0.01, defaultFinish: "glossy" },
];

export const FINISHES: Finish[] = [
  { id: "matte", name: "Matte", roughness: 0.85, metalness: 0, clearcoat: 0, transmission: 0, opacity: 1 },
  { id: "glossy", name: "Glossy", roughness: 0.12, metalness: 0.05, clearcoat: 1, transmission: 0, opacity: 1 },
  { id: "leather", name: "Leather", roughness: 0.6, metalness: 0, clearcoat: 0.15, transmission: 0, opacity: 1 },
  { id: "transparent", name: "Transparent", roughness: 0.08, metalness: 0, clearcoat: 1, transmission: 0.0, opacity: 0.55 },
];

/** Extra cost for premium finishes. */
export const FINISH_SURCHARGE: Record<string, number> = { matte: 0, glossy: 2, leather: 6, transparent: 3 };

export const FONTS = ["Inter", "Georgia", "Courier New", "Impact", "Brush Script MT", "Trebuchet MS"];
export const SWATCHES = ["#ffffff", "#111111", "#7c5cff", "#ff5c8a", "#ff9f43", "#2ed573", "#1e90ff", "#ffd32a"];

/** Design canvas resolution. Aspect matches the case back; texture is mapped 1:1. */
export const CANVAS_W = 360;
export const CANVAS_H = 740;
