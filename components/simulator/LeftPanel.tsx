"use client";

import { CASE_TYPES, FINISHES, PHONES, SWATCHES } from "@/lib/catalog";
import { useSim } from "@/lib/store";

function Option({ active, onClick, title, sub, right }: { active: boolean; onClick: () => void; title: string; sub?: string; right?: string }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${active ? "border-brand bg-brand/10" : "border-neutral-200 hover:border-neutral-400 dark:border-neutral-700"}`}>
      <span><span className="block font-medium">{title}</span>{sub && <span className="block text-xs text-neutral-500">{sub}</span>}</span>
      {right && <span className="text-xs tabular-nums text-neutral-500">{right}</span>}
    </button>
  );
}

export default function LeftPanel() {
  const { phoneId, caseId, finishId, caseColor, setPhone, setCase, setFinish, setCaseColor } = useSim();
  return (
    <aside className="card space-y-5 p-4">
      <section>
        <span className="label">Phone model</span>
        <div className="space-y-2">
          {PHONES.map((p) => <Option key={p.id} active={p.id === phoneId} onClick={() => setPhone(p.id)} title={p.name} right={`$${p.price}`} />)}
        </div>
      </section>
      <section>
        <span className="label">Case type</span>
        <div className="space-y-2">
          {CASE_TYPES.map((c) => <Option key={c.id} active={c.id === caseId} onClick={() => setCase(c.id)} title={c.name} sub={c.description} right={`+$${c.price}`} />)}
        </div>
      </section>
      <section>
        <span className="label">Finish</span>
        <div className="grid grid-cols-2 gap-2">
          {FINISHES.map((f) => (
            <button key={f.id} onClick={() => setFinish(f.id)} aria-pressed={f.id === finishId}
              className={`rounded-xl border px-3 py-2 text-sm ${f.id === finishId ? "border-brand bg-brand/10" : "border-neutral-200 dark:border-neutral-700"}`}>{f.name}</button>
          ))}
        </div>
      </section>
      <section>
        <span className="label">Case colour</span>
        <div className="flex flex-wrap items-center gap-2">
          {SWATCHES.map((c) => (
            <button key={c} aria-label={c} onClick={() => setCaseColor(c)} style={{ background: c }}
              className={`h-8 w-8 rounded-full border border-black/15 ${caseColor.toLowerCase() === c ? "ring-2 ring-brand ring-offset-2 ring-offset-white dark:ring-offset-neutral-900" : ""}`} />
          ))}
          <input type="color" value={caseColor} onChange={(e) => setCaseColor(e.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Custom case colour" />
        </div>
      </section>
    </aside>
  );
}
