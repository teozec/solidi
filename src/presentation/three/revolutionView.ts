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
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import type { Point2 } from '../../domain/geometry/polygon';
import type { PlaneFigure } from '../../domain/revolution/planeFigure';
import { FULL_TURN, turnAngle } from '../../domain/revolution/turn';
import { AXIS_COLOR, INK, TRAIL_COLOR } from '../appearance';
import { addFloorGrid, disposeGeometries, type SceneHandle, type Vec3 } from './scene';

export const REVOLUTION_HOME_VIEW: { pos: Vec3; target: Vec3 } = { pos: [5, 3.6, 6.5], target: [0, 1.2, 0] };

export interface RevolutionColors {
  readonly solid: string;
  readonly figure: string;
}

/** 3D objects of the current figure; rebuilt when the figure changes. */
interface Parts {
  figure: PlaneFigure;
  root: THREE.Group;
  turning: THREE.Group;
  startCap: THREE.Mesh;
  surface: THREE.Group;
  trail: LineSegments2;
  surfaceMaterial: THREE.MeshStandardMaterial;
}

function lineGeometry(pairs: number[]): LineSegmentsGeometry {
  const g = new LineSegmentsGeometry();
  g.setPositions(pairs.length ? pairs : [0, 0, 0, 0, 0, 0]);
  return g;
}

const toVector2 = (points: readonly Point2[]) => points.map(([x, y]) => new THREE.Vector2(x, y));

/**
 * The red axis, the plane figure turning around it, the surface it sweeps and the orange trails of
 * its outermost points.
 */
export function createRevolutionView({ scene, lineMaterial }: SceneHandle) {
  addFloorGrid(scene, 12);

  const axisMaterial = new THREE.MeshBasicMaterial({ color: AXIS_COLOR });
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 4.4, 16), axisMaterial);
  axis.position.y = 1.3;
  const axisTip = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.3, 20), axisMaterial);
  axisTip.position.y = 3.65;
  scene.add(axis, axisTip);

  const outlineMaterial = lineMaterial({ color: INK, linewidth: 3 });
  const trailMaterial = lineMaterial({ color: TRAIL_COLOR, linewidth: 3 });

  let parts: Parts | null = null;

  function show(figure: PlaneFigure, colors: RevolutionColors) {
    if (parts) {
      scene.remove(parts.root);
      disposeGeometries(parts.root);
    }
    const root = new THREE.Group();
    // The figure starts facing the viewer (right of the axis) and its sweep goes behind first.
    const [cx, , cz] = REVOLUTION_HOME_VIEW.pos;
    root.rotation.y = Math.atan2(cx, cz) + Math.PI / 2;

    const surfaceMaterial = new THREE.MeshStandardMaterial({ color: colors.solid, side: THREE.DoubleSide, roughness: 0.55 });
    const figureMaterial = new THREE.MeshStandardMaterial({
      color: colors.figure,
      side: THREE.DoubleSide,
      roughness: 0.6,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      // Drawn after the see-through surface, so it keeps its bright color.
      transparent: true,
    });

    const shape = new THREE.ShapeGeometry(new THREE.Shape(toVector2(figure.vertices)));
    const outline = figure.sides.flatMap(([[x1, y1], [x2, y2]]) => [x1, y1, 0, x2, y2, 0]);
    const turning = new THREE.Group();
    turning.add(new THREE.Mesh(shape, figureMaterial), new LineSegments2(lineGeometry(outline), outlineMaterial));
    turning.traverse((o) => (o.renderOrder = 2));

    // A cap where the sweep starts, so that the filled solid does not look hollow while turning.
    const startCap = new THREE.Mesh(shape, surfaceMaterial);
    startCap.rotation.y = -Math.PI / 2;

    const surface = new THREE.Group();
    const trail = new LineSegments2(new LineSegmentsGeometry(), trailMaterial);
    root.add(turning, startCap, surface, trail);
    scene.add(root);
    parts = { figure, root, turning, startCap, surface, trail, surfaceMaterial };
  }

  function buildSurface(p: Parts, angle: number) {
    disposeGeometries(p.surface);
    p.surface.clear();
    if (angle < 0.001) return;
    const segments = Math.max(2, Math.ceil((96 * angle) / FULL_TURN));
    const add = (geometry: THREE.BufferGeometry) => p.surface.add(new THREE.Mesh(geometry, p.surfaceMaterial));
    if (p.figure.curved) {
      // One smooth surface for the whole outline (open polyline, axis side excluded).
      add(new THREE.LatheGeometry(toVector2(p.figure.vertices), segments, 0, angle));
      return;
    }
    // One piece per side: sharp edges and correct lighting.
    for (const side of p.figure.sweepingSides) {
      const geometry = new THREE.LatheGeometry(toVector2(side), segments, 0, angle);
      geometry.computeVertexNormals();
      add(geometry);
    }
  }

  function buildTrail(p: Parts, angle: number) {
    p.trail.geometry.dispose();
    const pairs: number[] = [];
    const n = Math.ceil((64 * angle) / FULL_TURN);
    for (const [r, y] of p.figure.trailPoints()) {
      for (let i = 0; i < n; i++) {
        const a = (angle * i) / n;
        const b = (angle * (i + 1)) / n;
        pairs.push(r * Math.sin(a), y, r * Math.cos(a), r * Math.sin(b), y, r * Math.cos(b));
      }
    }
    p.trail.geometry = lineGeometry(pairs);
    p.trail.visible = pairs.length > 0;
  }

  /** Shows the figure after `fraction` of a full turn. */
  function render(fraction: number, filled: boolean) {
    if (!parts) return;
    const m = parts.surfaceMaterial;
    if (m.transparent === filled) {
      m.transparent = !filled;
      m.opacity = filled ? 1 : 0.45;
      m.depthWrite = filled;
      m.needsUpdate = true;
    }
    const angle = turnAngle(fraction);
    // LatheGeometry starts at +z: the figure's plane is rotated to match the end of the sweep.
    parts.turning.rotation.y = angle - Math.PI / 2;
    parts.startCap.visible = filled && fraction > 0.01 && fraction < 0.999;
    buildSurface(parts, angle);
    buildTrail(parts, angle);
  }

  return { show, render };
}
