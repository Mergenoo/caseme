"use client";

import DesignCanvas from "./DesignCanvas";

/** Right panel hosts the Fabric design canvas + its controls. */
export default function RightPanel() {
  return (
    <aside className="card p-4">
      <span className="label">Design your case</span>
      <DesignCanvas />
    </aside>
  );
}
