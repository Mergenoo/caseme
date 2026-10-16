import { create } from "zustand";
import type { CaseTypeId, FinishId, PhoneModelId } from "./types";
import { CASE_TYPES, FINISH_SURCHARGE, PHONES } from "./catalog";

interface SimState {
  phoneId: PhoneModelId;
  caseId: CaseTypeId;
  finishId: FinishId;
  caseColor: string;
  canvasBg: string;
  preview3D: boolean;
  cart: number;
  savedAt: number | null;
  /** Bumped by canvas whenever its content changes → 3D texture needsUpdate. */
  textureVersion: number;
  /** Imperative handles registered by DesignCanvas so other panels can call them. */
  actions: {
    uploadImage?: (file: File) => void;
    addText?: () => void;
    clear?: () => void;
    deleteSelected?: () => void;
    serialize?: () => string;
  };
  setPhone: (id: PhoneModelId) => void;
  setCase: (id: CaseTypeId) => void;
  setFinish: (id: FinishId) => void;
  setCaseColor: (c: string) => void;
  setCanvasBg: (c: string) => void;
  togglePreview: () => void;
  bumpTexture: () => void;
  registerActions: (a: SimState["actions"]) => void;
  addToCart: () => void;
  markSaved: () => void;
}

export const useSim = create<SimState>((set) => ({
  phoneId: "iphone16pro",
  caseId: "silicone",
  finishId: "matte",
  caseColor: "#7c5cff",
  canvasBg: "#ffffff",
  preview3D: true,
  cart: 0,
  savedAt: null,
  textureVersion: 0,
  actions: {},
  setPhone: (phoneId) => set({ phoneId }),
  // choosing a case type also applies its natural finish
  setCase: (caseId) =>
    set({ caseId, finishId: CASE_TYPES.find((c) => c.id === caseId)!.defaultFinish }),
  setFinish: (finishId) => set({ finishId }),
  setCaseColor: (caseColor) => set({ caseColor }),
  setCanvasBg: (canvasBg) => set({ canvasBg }),
  togglePreview: () => set((s) => ({ preview3D: !s.preview3D })),
  bumpTexture: () => set((s) => ({ textureVersion: s.textureVersion + 1 })),
  registerActions: (actions) => set({ actions }),
  addToCart: () => set((s) => ({ cart: s.cart + 1 })),
  markSaved: () => set({ savedAt: Date.now() }),
}));

export const selectPrice = (s: Pick<SimState, "phoneId" | "caseId" | "finishId">) =>
  PHONES.find((p) => p.id === s.phoneId)!.price +
  CASE_TYPES.find((c) => c.id === s.caseId)!.price +
  (FINISH_SURCHARGE[s.finishId] ?? 0);
