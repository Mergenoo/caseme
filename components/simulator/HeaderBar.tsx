"use client";

import { useEffect, useState } from "react";
import { Box, Check, Moon, ShoppingCart, Save, Sun } from "lucide-react";
import { selectPrice, useSim } from "@/lib/store";

export default function HeaderBar() {
  const price = useSim(selectPrice);
  const { preview3D, togglePreview, cart, addToCart, markSaved, actions, savedAt } = useSim();
  const [dark, setDark] = useState(false);

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);

  const save = () => {
    const json = actions.serialize?.();
    if (json) { try { localStorage.setItem("caseme:design", json); } catch { /* storage unavailable */ } }
    markSaved();
  };
  const saved = savedAt && Date.now() - savedAt < 2500;

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
      <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white">C</span>
        Case<span className="text-brand">Me</span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="mr-2 text-right leading-tight">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">Total</div>
          <div data-testid="price" className="text-xl font-bold tabular-nums">${price.toFixed(2)}</div>
        </div>
        <button onClick={togglePreview} aria-pressed={preview3D} className={`btn ${preview3D ? "btn-primary" : "btn-ghost"}`}>
          <Box className="h-4 w-4" /> Preview 3D
        </button>
        <button onClick={save} className="btn btn-ghost">
          {saved ? <Check className="h-4 w-4 text-green-500" /> : <Save className="h-4 w-4" />} {saved ? "Saved" : "Save Design"}
        </button>
        <button onClick={addToCart} className="btn btn-primary">
          <ShoppingCart className="h-4 w-4" /> Add to Cart{cart > 0 && <span className="rounded-full bg-white/25 px-1.5 text-xs">{cart}</span>}
        </button>
        <button onClick={() => setDark((d) => !d)} aria-label="Toggle theme" className="btn btn-ghost px-2.5">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
