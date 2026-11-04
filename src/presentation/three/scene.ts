/*
 * I Solidi: an interactive website that teaches solids to primary school children.
 * Copyright (C) 2026  Matteo Zeccoli Marazzini
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LineMaterial, type LineMaterialParameters } from 'three/addons/lines/LineMaterial.js';

export type Vec3 = [number, number, number];

export interface SceneOptions {
  cameraPos?: Vec3;
  target?: Vec3;
}

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  renderer: THREE.WebGLRenderer;
  /** Smoothly moves the camera to a new position and look-at target. */
  flyTo: (pos: Vec3, target: Vec3, ms?: number) => void;
  /** Material for thick lines; its resolution follows the container size. */
  lineMaterial: (opts: LineMaterialParameters) => LineMaterial;
}

interface Flight {
  fromPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPos: THREE.Vector3;
  toTarget: THREE.Vector3;
  start: number;
  ms: number;
}

/** Creates the 3D scene inside `container`: renderer, camera, lights, orbit controls and render loop. */
export function createScene(container: HTMLElement, { cameraPos = [6, 4, 8], target = [0, 1, 0] }: SceneOptions = {}): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#f3f6ff');

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(...cameraPos);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa4c4, 1.8));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(5, 10, 7);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffffff, 0.8);
  fill.position.set(-6, 3, -5);
  scene.add(fill);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(...target);
  controls.minDistance = 3;
  controls.maxDistance = 40;

  const lineMaterials = new Set<LineMaterial>();
  const lineMaterial = (opts: LineMaterialParameters): LineMaterial => {
    const m = new LineMaterial({ linewidth: 3, ...opts });
    lineMaterials.add(m);
    m.resolution.set(container.clientWidth, container.clientHeight);
    return m;
  };

  const resize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    for (const m of lineMaterials) m.resolution.set(w, h);
  };
  new ResizeObserver(resize).observe(container);
  resize();

  let flight: Flight | null = null;
  const flyTo = (pos: Vec3, tgt: Vec3, ms = 900) => {
    flight = {
      fromPos: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPos: new THREE.Vector3(...pos),
      toTarget: new THREE.Vector3(...tgt),
      start: performance.now(),
      ms,
    };
  };
  // The user grabbing the view cancels any camera flight.
  controls.addEventListener('start', () => (flight = null));

  renderer.setAnimationLoop(() => {
    if (flight) {
      const k = Math.min(1, (performance.now() - flight.start) / flight.ms);
      const e = k * k * (3 - 2 * k);
      camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
      controls.target.lerpVectors(flight.fromTarget, flight.toTarget, e);
      if (k >= 1) flight = null;
    }
    controls.update();
    renderer.render(scene, camera);
  });

  return { scene, camera, controls, renderer, flyTo, lineMaterial };
}

/** Light grid on the floor, just below y = 0 to avoid flickering with faces lying on the ground. */
export function addFloorGrid(scene: THREE.Scene, size: number): void {
  const grid = new THREE.GridHelper(size, size, '#c3cdea', '#dde3f4');
  grid.position.y = -0.02;
  scene.add(grid);
}

/** Smooth start and stop for animations: maps 0 → 0 and 1 → 1. */
export const smoothstep = (x: number): number => x * x * (3 - 2 * x);

export function disposeGeometries(obj: THREE.Object3D): void {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose();
  });
}
