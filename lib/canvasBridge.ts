/**
 * Tiny module-level bridge between the 2D Fabric canvas and the 3D scene.
 * DesignCanvas publishes the *bottom* <canvas> element of Fabric (the one that
 * contains the rendered artwork but not the selection handles). PhoneViewer
 * wraps that element in a THREE.CanvasTexture and flags it dirty whenever
 * `textureVersion` in the store changes.
 */
let source: HTMLCanvasElement | null = null;
export const setCanvasSource = (el: HTMLCanvasElement | null) => { source = el; };
export const getCanvasSource = () => source;
