"use client";

import { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Html, OrbitControls, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { CASE_TYPES, FINISHES, PHONES } from "@/lib/catalog";
import { getCanvasSource } from "@/lib/canvasBridge";
import { useSim } from "@/lib/store";

/** Rounded-rectangle outline, centered at origin. */
function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

function Loader() {
  const { progress } = useProgress();
  return <Html center><div className="whitespace-nowrap rounded-full bg-black/70 px-3 py-1 text-xs text-white">Loading 3D… {progress.toFixed(0)}%</div></Html>;
}

/**
 * The phone + case. Back of the phone faces +Z.
 * The shell uses back-projected UVs (0..1 across the case back) so the
 * Fabric canvas maps 1:1 onto the back and wraps over the edges.
 */
function PhoneWithCase() {
  const { phoneId, caseId, finishId, caseColor, textureVersion } = useSim();
  const phone = PHONES.find((p) => p.id === phoneId)!;
  const cs = CASE_TYPES.find((c) => c.id === caseId)!;
  const fin = FINISHES.find((f) => f.id === finishId)!;

  const cw = phone.width + cs.thickness * 2;
  const ch = phone.height + cs.thickness * 2;
  const cd = phone.depth + cs.thickness + cs.bumper;
  const cr = phone.radius + cs.thickness;

  // Case shell: extruded rounded rect with soft bevel.
  const shellGeo = useMemo(
    () => new THREE.ExtrudeGeometry(roundedRect(cw, ch, cr), {
      depth: cd, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 6, curveSegments: 24,
    }),
    [cw, ch, cd, cr],
  );

  // Planar (back-projected) UVs for the WHOLE shell: back face, bevel and side walls.
  // The artwork covers the back; the texture is CLAMPED so its edge pixels streak
  // down the sides and read as the design wrapping around the case edge.
  useMemo(() => {
    const pos = shellGeo.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = pos.getX(i) / cw + 0.5;
      uv[i * 2 + 1] = pos.getY(i) / ch + 0.5;
    }
    shellGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }, [shellGeo, cw, ch]);

  // Fine procedural grain for matte / leather / silicone surfaces (bump only).
  const grain = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const d = g.createImageData(128, 128);
    for (let i = 0; i < d.data.length; i += 4) { const v = 90 + Math.random() * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(10, 20);
    return t;
  }, []);

  /**
   * CanvasTexture mapping: wrap Fabric's rendered <canvas> in a texture.
   * three re-uploads the pixels to the GPU only when `needsUpdate` is set,
   * which we do whenever the store's `textureVersion` changes (bumped by every
   * Fabric `after:render`). Anisotropy keeps text crisp at oblique angles.
   */
  const texture = useMemo(() => {
    const src = getCanvasSource();
    if (!src) return null;
    const t = new THREE.CanvasTexture(src);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 8;
    return t;
    // textureVersion included so we pick up the source once Fabric has mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureVersion === 0 ? 0 : 1]);
  useEffect(() => { if (texture) texture.needsUpdate = true; }, [texture, textureVersion]);
  useEffect(() => () => texture?.dispose(), [texture]);

  // Front display (visible when you orbit round to the front): bezel + lock screen.
  const screenW = phone.width - 0.05, screenH = phone.height - 0.05;
  const bezelGeo = useMemo(() => {
    const g = new THREE.ShapeGeometry(roundedRect(phone.width - 0.02, phone.height - 0.02, phone.radius - 0.01), 24);
    return g;
  }, [phone]);
  const screenGeo = useMemo(() => {
    const g = new THREE.ShapeGeometry(roundedRect(screenW, screenH, phone.radius - 0.03), 24);
    const pos = g.attributes.position;
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = 1 - (pos.getX(i) / screenW + 0.5); // mirrored: plane is turned to face -Z
      uv[i * 2 + 1] = pos.getY(i) / screenH + 0.5;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  }, [phone, screenW, screenH]);
  const screenTex = useMemo(() => {
    const W = 512, H = Math.round((512 * screenH) / screenW);
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d")!;
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1e1b4b"); bg.addColorStop(0.5, "#7c5cff"); bg.addColorStop(1, "#ff7ab6");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const glow = g.createRadialGradient(W * 0.7, H * 0.75, 10, W * 0.7, H * 0.75, W * 0.7);
    glow.addColorStop(0, "rgba(255,255,255,0.35)"); glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow; g.fillRect(0, 0, W, H);
    g.fillStyle = "#fff"; g.textAlign = "center";
    g.font = "500 28px Inter, Arial"; g.fillText("Friday, 16 October", W / 2, H * 0.2);
    g.font = "700 150px Inter, Arial"; g.fillText("9:41", W / 2, H * 0.2 + 150);
    g.fillStyle = "rgba(255,255,255,0.9)"; g.font = "700 30px Inter, Arial"; g.fillText("CaseMe", W / 2, H * 0.92);
    // dynamic island
    g.fillStyle = "#000"; g.beginPath(); g.roundRect(W / 2 - 62, 22, 124, 36, 18); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  }, [screenW, screenH]);
  useEffect(() => () => screenTex.dispose(), [screenTex]);

  const clear = finishId === "transparent";
  const matProps = {
    roughness: fin.roughness, metalness: fin.metalness, clearcoat: fin.clearcoat, clearcoatRoughness: 0.1,
    transparent: clear, opacity: fin.opacity,
  };

  // Camera module: rounded-square island inset from the top-left corner of the back.
  const modW = phone.camera === "dual" ? 0.3 : phone.camera === "triple" ? 0.38 : 0.28;
  const modH = phone.camera === "dual" ? 0.4 : phone.camera === "triple" ? 0.38 : 0.62;
  const inset = cs.thickness + 0.05;
  const camX = -cw / 2 + inset + modW / 2, camY = ch / 2 - inset - modH / 2;
  const lensR = phone.camera === "quad" ? 0.062 : 0.075;
  const lenses: [number, number][] = phone.camera === "dual" ? [[0, 0.09], [0, -0.09]]
    : phone.camera === "triple" ? [[-0.085, 0.085], [0.085, 0.085], [-0.085, -0.085]]
    : [[0, 0.2], [0, 0.0], [0, -0.2]];
  const modGeo = useMemo(
    () => new THREE.ExtrudeGeometry(roundedRect(modW, modH, 0.07), { depth: 0.03, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 4, curveSegments: 16 }),
    [modW, modH],
  );

  // Gentle idle float so the model feels alive; OrbitControls still works on top.
  

  return (
    <group position={[0, 0, -cd / 2]}>
      {/* the phone itself (visible through transparent / wallet cases) */}
      <mesh position={[0, 0, cs.thickness * 0.5]} castShadow>
        <extrudeGeometry args={[roundedRect(phone.width, phone.height, phone.radius), { depth: phone.depth, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 4, curveSegments: 24 }]} />
        <meshPhysicalMaterial color="#1b1b1f" roughness={0.35} metalness={0.8} />
      </mesh>

      {/* front display: black bezel + glowing lock screen, facing -Z */}
      <group position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]}>
        <mesh geometry={bezelGeo}><meshStandardMaterial color="#050507" roughness={0.3} /></mesh>
        <mesh geometry={screenGeo} position={[0, 0, 0.002]}>
          <meshBasicMaterial map={screenTex} toneMapped={false} />
        </mesh>
      </group>

      {/* case shell in the base colour (with grain for non-glossy finishes) */}
      <mesh geometry={shellGeo} castShadow receiveShadow>
        <meshPhysicalMaterial color={caseColor} {...matProps}
          bumpMap={finishId === "glossy" || clear ? undefined : grain} bumpScale={finishId === "leather" ? 1.2 : 0.4} />
      </mesh>

      {/* printed artwork: same geometry, transparent texture layer pulled forward
          with polygonOffset so it wraps back + edges and shows the base colour
          wherever the design canvas is empty */}
      {texture && (
        <mesh geometry={shellGeo}>
          <meshPhysicalMaterial map={texture} transparent depthWrite={false}
            polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2}
            roughness={fin.roughness} metalness={0} clearcoat={fin.clearcoat} clearcoatRoughness={0.1}
            opacity={clear ? 0.9 : 1} />
        </mesh>
      )}

      {/* camera island: rounded glass-black plate + ringed lenses + flash */}
      <group position={[camX, camY, cd + 0.016]}>
        <mesh geometry={modGeo} castShadow>
          <meshPhysicalMaterial color="#15151a" roughness={0.25} metalness={0.4} clearcoat={1} />
        </mesh>
        {lenses.map(([x, y], i) => (
          <group key={i} position={[x, y, 0.046]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh><cylinderGeometry args={[lensR, lensR, 0.03, 40]} /><meshStandardMaterial color="#8d8d96" metalness={1} roughness={0.25} /></mesh>
            <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[lensR * 0.78, lensR * 0.78, 0.012, 40]} /><meshStandardMaterial color="#0b0b0e" metalness={0.6} roughness={0.3} /></mesh>
            <mesh position={[0, 0.019, 0]}><cylinderGeometry args={[lensR * 0.5, lensR * 0.5, 0.006, 32]} /><meshPhysicalMaterial color="#0a1840" metalness={0.2} roughness={0.05} clearcoat={1} /></mesh>
          </group>
        ))}
        {/* flash */}
        <mesh position={[phone.camera === "triple" ? 0.085 : modW / 2 - 0.06, phone.camera === "triple" ? -0.085 : modH / 2 - 0.06, 0.044]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.01, 24]} /><meshStandardMaterial color="#f4ecd0" emissive="#f4ecd0" emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* type-specific details */}
      {caseId === "magsafe" && (
        <mesh position={[0, -0.05, cd + 0.02]}>
          <torusGeometry args={[0.27, 0.012, 16, 64]} />
          <meshStandardMaterial color="#cfcfd6" metalness={0.9} roughness={0.25} />
        </mesh>
      )}
      {caseId === "armor" && (
        <>
          {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sy], i) => (
            <mesh key={i} position={[sx * (cw / 2 - 0.05), sy * (ch / 2 - 0.05), cd * 0.55]}>
              <sphereGeometry args={[0.07, 24, 24]} />
              <meshStandardMaterial color="#1a1a1d" roughness={0.9} />
            </mesh>
          ))}
        </>
      )}
      {caseId === "wallet" && (
        <mesh position={[-cw / 2 - 0.012, 0, cd / 2]}>
          <boxGeometry args={[0.03, ch * 0.96, cd + 0.03]} />
          <meshStandardMaterial color={caseColor} roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

export default function PhoneViewer() {
  const preview3D = useSim((s) => s.preview3D);
  return (
    <div className="relative h-full min-h-[360px] w-full overflow-hidden rounded-2xl bg-gradient-to-b from-neutral-100 to-neutral-300 dark:from-neutral-800 dark:to-neutral-950">
      {preview3D ? (
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0.1, 5.2], fov: 35 }} gl={{ antialias: true, preserveDrawingBuffer: false }}>
          <Suspense fallback={<Loader />}>
            {/* studio lighting: HDRI-style environment + key light with soft shadow */}
            <Environment preset="studio" environmentIntensity={0.7} />
            <directionalLight position={[3, 4, 3]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
            <PhoneWithCase />
            <ContactShadows position={[0, -1.05, 0]} opacity={0.45} scale={6} blur={2.6} far={2} />
          </Suspense>
          <OrbitControls enablePan enableZoom enableDamping minDistance={2.5} maxDistance={9} />
        </Canvas>
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-neutral-500">3D preview is off</div>
      )}
      <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[11px] text-white">
        Drag to rotate · Scroll to zoom · Right-drag to pan
      </div>
    </div>
  );
}
