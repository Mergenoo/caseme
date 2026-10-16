"use client";

import DesignCanvas from "./DesignCanvas";

/** Right panel hosts the Fabric design canvas + its controls. */
export default function RightPanel() {
  return (
    <aside className="card p-4 lg:sticky lg:top-[76px] lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto">
      <span className="label">Design your case</span>
      <DesignCanvas />
    </aside>
  );
}
