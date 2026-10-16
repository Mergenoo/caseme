"use client";

import dynamic from "next/dynamic";
import HeaderBar from "./HeaderBar";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";

// WebGL needs the browser: load the viewer client-side only, with a skeleton.
const PhoneViewer = dynamic(() => import("./PhoneViewer"), {
  ssr: false,
  loading: () => <div className="grid h-full min-h-[360px] animate-pulse place-items-center rounded-2xl bg-neutral-200 text-sm text-neutral-500 dark:bg-neutral-800">Preparing 3D scene…</div>,
});

export default function Simulator() {
  return (
    <div className="min-h-screen">
      <HeaderBar />
      <main className="mx-auto grid max-w-[1500px] gap-4 p-4 lg:grid-cols-[300px_minmax(0,1fr)_420px]">
        <LeftPanel />
        <section className="order-first h-[60vh] lg:order-none lg:sticky lg:top-[76px] lg:h-[calc(100vh-92px)]">
          <PhoneViewer />
        </section>
        <RightPanel />
      </main>
    </div>
  );
}
