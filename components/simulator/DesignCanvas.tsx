"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas, FabricImage, FabricObject, IText } from "fabric";

/** Smallest on-canvas size (px) an object may be scaled to, so it can always be grabbed again. */
const MIN_SIZE = 48;
import { ImagePlus, Type, Trash2, Eraser, UploadCloud, Crosshair, Maximize, RotateCw, Layers } from "lucide-react";
import { CANVAS_H, CANVAS_W, FONTS, SWATCHES } from "@/lib/catalog";
import { setCanvasSource } from "@/lib/canvasBridge";
import { useSim } from "@/lib/store";

/**
 * 2D design surface (Fabric.js). Everything drawn here is mirrored live onto
 * the 3D case: every Fabric render event bumps `textureVersion` in the store,
 * which makes the CanvasTexture in PhoneViewer re-upload this canvas.
 */
export default function DesignCanvas() {
  const elRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<FabricObject | null>(null);
  const [drag, setDrag] = useState(false);
  const [hasObjects, setHasObjects] = useState(false);
  const [, force] = useState(0);
  const [layers, setLayers] = useState<FabricObject[]>([]);

  const canvasBg = useSim((s) => s.canvasBg);
  const setCanvasBg = useSim((s) => s.setCanvasBg);
  const bump = useSim((s) => s.bumpTexture);
  const registerActions = useSim((s) => s.registerActions);

  const uploadImage = useCallback(async (file: File) => {
    const c = fabricRef.current;
    if (!c || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await FabricImage.fromURL(url);
      // Full-bleed by default: scale to COVER the canvas so the photo wraps the whole case
      // (including edges). Users can shrink it afterwards.
      const scale = Math.max(CANVAS_W / img.width!, CANVAS_H / img.height!);
      img.set({ scaleX: scale, scaleY: scale, left: CANVAS_W / 2, top: CANVAS_H / 2, originX: "center", originY: "center" });
      c.add(img);
      c.setActiveObject(img);
      c.requestRenderAll();
    } finally {
      // bitmap is already decoded into the element; safe to release
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }, []);

  const addText = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    const t = new IText("Your text", {
      left: CANVAS_W / 2, top: CANVAS_H / 2, originX: "center", originY: "center",
      fontFamily: "Inter", fontSize: 40, fill: "#111111", fontWeight: "700",
    });
    c.add(t);
    c.setActiveObject(t);
    c.requestRenderAll();
  }, []);

  const deleteSelected = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    c.getActiveObjects().forEach((o) => c.remove(o));
    c.discardActiveObject();
    c.requestRenderAll();
  }, []);

  const clear = useCallback(() => {
    const c = fabricRef.current;
    if (!c) return;
    c.remove(...c.getObjects());
    c.discardActiveObject();
    c.requestRenderAll();
  }, []);

  // --- init fabric once ---
  useEffect(() => {
    if (!elRef.current) return;
    const c = new Canvas(elRef.current, {
      width: CANVAS_W, height: CANVAS_H, backgroundColor: useSim.getState().canvasBg ?? "",
      preserveObjectStacking: true,
    });
    fabricRef.current = c;
    // Big, touch-friendly handles so even small images stay easy to grab.
    FabricObject.ownDefaults.cornerSize = 14;
    FabricObject.ownDefaults.touchCornerSize = 28;
    FabricObject.ownDefaults.transparentCorners = false;
    FabricObject.ownDefaults.cornerColor = "#7c5cff";
    FabricObject.ownDefaults.cornerStyle = "circle";
    FabricObject.ownDefaults.borderColor = "#7c5cff";
    FabricObject.ownDefaults.padding = 4;
    // Publish the rendered (lower) canvas for the 3D texture.
    setCanvasSource(c.lowerCanvasEl);

    const sync = () => { setHasObjects(c.getObjects().length > 0); setLayers([...c.getObjects()]); bump(); };
    // Never let an object shrink below MIN_SIZE: it would become impossible to select again.
    c.on("object:scaling", (e) => {
      const o = e.target;
      const w = o.width * o.scaleX, h = o.height * o.scaleY;
      if (w < MIN_SIZE || h < MIN_SIZE) {
        const k = Math.max(MIN_SIZE / o.width, MIN_SIZE / o.height);
        o.set({ scaleX: Math.max(o.scaleX, k), scaleY: Math.max(o.scaleY, k) });
      }
    });
    c.on("after:render", bump); // every redraw → refresh 3D texture
    c.on("object:added", sync);
    c.on("object:removed", sync);
    const sel = () => setSelected(c.getActiveObject() ?? null);
    c.on("selection:created", sel);
    c.on("selection:updated", sel);
    c.on("selection:cleared", sel);
    c.on("object:modified", () => force((n) => n + 1));
    c.on("object:scaling", () => force((n) => n + 1));

    registerActions({
      uploadImage, addText, clear, deleteSelected,
      serialize: () => JSON.stringify(c.toJSON()),
    });
    bump();

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select")) return;
      const active = c.getActiveObject() as IText | undefined;
      if ((e.key === "Delete" || e.key === "Backspace") && active && !(active as IText).isEditing) deleteSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      setCanvasSource(null);
      c.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // background colour from the store
  useEffect(() => {
    const c = fabricRef.current;
    if (!c) return;
    c.backgroundColor = canvasBg ?? "";
    c.requestRenderAll();
  }, [canvasBg]);

  const sel = selected as FabricObject | null;
  const minScale = sel ? Math.max(MIN_SIZE / sel.width, MIN_SIZE / sel.height) : 0.1;
  const rerender = () => { fabricRef.current?.requestRenderAll(); force((n) => n + 1); };
  const setScale = (v: number) => { sel?.set({ scaleX: v, scaleY: v }); sel?.setCoords(); rerender(); };
  const centerSel = () => { sel?.set({ left: CANVAS_W / 2, top: CANVAS_H / 2, originX: "center", originY: "center" }); sel?.setCoords(); rerender(); };
  // "Fill": scale up until the object covers the whole canvas (full-bleed print)
  const fillSel = () => { if (!sel) return; setScale(Math.max(CANVAS_W / sel.width, CANVAS_H / sel.height)); centerSel(); };
  const rotateSel = () => { sel?.set({ angle: ((sel.angle ?? 0) + 90) % 360 }); sel?.setCoords(); rerender(); };
  const pick = (o: FabricObject) => { const c = fabricRef.current; if (!c) return; c.setActiveObject(o); c.requestRenderAll(); setSelected(o); };
  const isText = selected instanceof IText;
  const setProp = (props: Record<string, unknown>) => {
    selected?.set(props);
    fabricRef.current?.requestRenderAll();
    force((n) => n + 1);
  };
  const t = selected as IText | null;

  return (
    <div className="flex flex-col gap-4">
      {/* Prominent upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) uploadImage(f); }}
        className={`rounded-2xl border-2 border-dashed p-4 text-center transition ${drag ? "border-brand bg-brand/10" : "border-brand/40 bg-brand/5"}`}
      >
        <UploadCloud className="mx-auto mb-1 h-7 w-7 text-brand" />
        <p className="text-sm font-semibold">Upload your photo</p>
        <p className="mb-3 text-xs text-neutral-500">Drag & drop or pick an image — it appears on the case instantly</p>
        <button data-testid="upload-btn" onClick={() => fileRef.current?.click()} className="btn btn-primary w-full py-3 text-base">
          <ImagePlus className="h-5 w-5" /> Upload Image
        </button>
        <input
          ref={fileRef} type="file" accept="image/*" hidden data-testid="upload-input"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }}
        />
      </div>

      {/* The 2D canvas */}
      <div className="flex shrink-0 items-center justify-center overflow-auto rounded-2xl bg-neutral-200/60 p-3 dark:bg-neutral-800/60">
        <div className="overflow-hidden rounded-[28px] shadow-lg ring-1 ring-black/10" style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100%" }}>
          <canvas ref={elRef} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={addText} className="btn btn-ghost"><Type className="h-4 w-4" /> Add Text</button>
        <button onClick={deleteSelected} disabled={!selected} className="btn btn-ghost disabled:opacity-40"><Trash2 className="h-4 w-4" /> Delete</button>
        <button onClick={clear} disabled={!hasObjects} className="btn btn-ghost col-span-2 disabled:opacity-40"><Eraser className="h-4 w-4" /> Clear design</button>
      </div>

      <div>
        <span className="label">Background</span>
        <ColorRow value={canvasBg ?? ""} onChange={setCanvasBg} allowNone />
      </div>

      {sel && (
        <div className="card space-y-3 p-3">
          <span className="label !mb-0">Selected item</span>
          <label className="flex items-center gap-3 text-xs">
            Scale
            <input type="range" min={minScale} max={Math.max(minScale * 4, 4)} step={0.01} value={Math.max(sel.scaleX ?? 1, minScale)}
              onChange={(e) => setScale(+e.target.value)} className="flex-1 accent-brand" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={centerSel} className="btn btn-ghost px-2 text-xs"><Crosshair className="h-3.5 w-3.5" /> Center</button>
            <button onClick={fillSel} className="btn btn-ghost px-2 text-xs"><Maximize className="h-3.5 w-3.5" /> Fill</button>
            <button onClick={rotateSel} className="btn btn-ghost px-2 text-xs"><RotateCw className="h-3.5 w-3.5" /> Rotate</button>
          </div>
        </div>
      )}

      {layers.length > 0 && (
        <div>
          <span className="label flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> Layers (tap to select)</span>
          <div className="flex flex-wrap gap-2">
            {layers.map((o, i) => (
              <button key={i} onClick={() => pick(o)}
                className={`rounded-lg border px-2.5 py-1 text-xs ${o === selected ? "border-brand bg-brand/10" : "border-neutral-300 dark:border-neutral-700"}`}>
                {o instanceof IText ? `Text: ${(o.text ?? "").slice(0, 10)}` : `Image ${i + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {isText && t && (
        <div className="card space-y-3 p-3">
          <span className="label !mb-0">Text</span>
          <select value={t.fontFamily} onChange={(e) => setProp({ fontFamily: e.target.value })} className="w-full rounded-lg border border-neutral-300 bg-transparent p-2 text-sm dark:border-neutral-700">
            {FONTS.map((f) => <option key={f} value={f} className="text-black">{f}</option>)}
          </select>
          <label className="flex items-center gap-3 text-xs">
            Size
            <input type="range" min={12} max={140} value={Math.round((t.fontSize ?? 40) * (t.scaleX ?? 1))}
              onChange={(e) => setProp({ fontSize: +e.target.value, scaleX: 1, scaleY: 1 })} className="flex-1 accent-brand" />
            <span className="w-8 text-right tabular-nums">{Math.round((t.fontSize ?? 40) * (t.scaleX ?? 1))}</span>
          </label>
          <ColorRow value={String(t.fill)} onChange={(v) => setProp({ fill: v })} />
        </div>
      )}
    </div>
  );
}

function ColorRow({ value, onChange, allowNone }: { value: string; onChange: (v: any) => void; allowNone?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {allowNone && (
        <button onClick={() => onChange(null)} className={`rounded-full border px-2.5 py-1 text-xs ${value === "" ? "border-brand bg-brand/10" : "border-neutral-300 dark:border-neutral-700"}`}>Case colour</button>
      )}
      {SWATCHES.map((c) => (
        <button key={c} aria-label={c} onClick={() => onChange(c)} style={{ background: c }}
          className={`h-7 w-7 rounded-full border border-black/15 ${value.toLowerCase() === c ? "ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-neutral-900" : ""}`} />
      ))}
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)}
        className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Custom colour" />
    </div>
  );
}
