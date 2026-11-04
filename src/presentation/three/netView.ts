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
import { hingeTransform, worldTransforms, type UnfoldingPlan } from '../../domain/nets/unfolding';
import { FACE_PALETTE, INK } from '../appearance';
import { addFloorGrid, disposeGeometries, type SceneHandle } from './scene';

/** Builds a face's triangles (fan) with a winding that agrees with its outward normal. */
function faceGeometry(points: THREE.Vector3[], normal: THREE.Vector3): THREE.BufferGeometry {
  const e1 = points[1].clone().sub(points[0]);
  const e2 = points[2].clone().sub(points[0]);
  // A winding that disagrees with the normal makes the inner side look dark once the net is open.
  const ccw = e1.cross(e2).dot(normal) > 0;
  const positions: number[] = [];
  for (let i = 1; i < points.length - 1; i++) {
    const triangle = ccw ? [points[0], points[i], points[i + 1]] : [points[0], points[i + 1], points[i]];
    for (const p of triangle) positions.push(p.x, p.y, p.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(positions.map((_, i) => normal.getComponent(i % 3)), 3));
  return geometry;
}

/** Bounding box of all faces for the given face angles. */
function bounds(plan: UnfoldingPlan, angles: number[]): THREE.Box3 {
  const transforms = worldTransforms(plan, angles);
  const box = new THREE.Box3();
  plan.polyhedron.faces.forEach((_, f) => {
    for (const p of plan.polyhedron.facePoints(f)) box.expandByPoint(p.applyMatrix4(transforms[f]));
  });
  return box;
}

/**
 * A polyhedron as a tree of groups, one per face: each face group is a child of the group of the face
 * it is attached to in the net, so rotating a face around its hinge carries along the faces attached to it.
 */
export function createNetView({ scene, lineMaterial, flyTo }: SceneHandle) {
  addFloorGrid(scene, 30);
  const edgeMaterial = lineMaterial({ color: INK, linewidth: 3 });

  let root: THREE.Group | null = null;
  let materials: THREE.Material[] = [];
  let nodes: THREE.Group[] = [];
  let current: UnfoldingPlan | null = null;
  let closedBox = new THREE.Box3();
  let flatBox = new THREE.Box3();

  function show(plan: UnfoldingPlan) {
    if (root) {
      scene.remove(root);
      disposeGeometries(root);
      for (const m of materials) m.dispose();
    }
    current = plan;
    const { polyhedron, net } = plan;

    const bySurface = new Map<string, THREE.MeshStandardMaterial>();
    for (const surface of polyhedron.surfaces) {
      if (bySurface.has(surface)) continue;
      bySurface.set(
        surface,
        new THREE.MeshStandardMaterial({
          color: FACE_PALETTE[bySurface.size % FACE_PALETTE.length],
          side: THREE.DoubleSide,
          roughness: 0.6,
          // Pushed back slightly so the edge lines on top never flicker.
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      );
    }
    materials = [...bySurface.values()];

    const newRoot = new THREE.Group();
    root = newRoot;
    nodes = polyhedron.faces.map(() => {
      const g = new THREE.Group();
      g.matrixAutoUpdate = false;
      return g;
    });
    polyhedron.faces.forEach((_, f) => {
      const node = nodes[f];
      node.add(new THREE.Mesh(faceGeometry(polyhedron.facePoints(f), plan.normals[f]), bySurface.get(polyhedron.surfaces[f])));
      const lines = plan.visibleEdges[f].flatMap(([a, b]) => [...polyhedron.vertices[a], ...polyhedron.vertices[b]]);
      if (lines.length) {
        const geometry = new LineSegmentsGeometry();
        geometry.setPositions(lines);
        node.add(new LineSegments2(geometry, edgeMaterial));
      }
      const parent = net.parent[f];
      (parent < 0 ? newRoot : nodes[parent]).add(node);
    });
    scene.add(newRoot);

    const zero = plan.hinges.map(() => 0);
    closedBox = bounds(plan, zero);
    flatBox = bounds(plan, plan.hinges.map((h) => h?.angle ?? 0));
  }

  /** Rotates every face around its hinge by the given angles. */
  function render(angles: number[]) {
    if (!current) return;
    current.hinges.forEach((hinge, f) => {
      if (!hinge) return;
      hingeTransform(hinge, angles[f], nodes[f].matrix);
      nodes[f].matrixWorldNeedsUpdate = true;
    });
  }

  /** 3D view framing both the closed solid and the open net. */
  function frame3D() {
    const box = flatBox.clone().union(closedBox);
    const c = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const d = Math.max(size.x, size.z) * 1.05 + 4;
    const dir = new THREE.Vector3(0.45, 0.6, 0.65).normalize().multiplyScalar(d);
    flyTo([c.x + dir.x, dir.y, c.z + dir.z], [c.x, 0.5, c.z]);
  }

  /** View from above, framing the open net. */
  function frameTop() {
    const c = flatBox.getCenter(new THREE.Vector3());
    const size = flatBox.getSize(new THREE.Vector3());
    const d = Math.max(size.x, size.z) * 1.7 + 1;
    flyTo([c.x, d, c.z + 0.01], [c.x, 0, c.z]);
  }

  return { show, render, frame3D, frameTop };
}
