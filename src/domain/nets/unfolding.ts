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

import { Matrix4, type Vector3 } from 'three';
import type { Net } from './net';
import type { Polyhedron } from './polyhedron';

/** Edge a face rotates around while opening, and the rotation that lays it flat next to its parent. */
export interface Hinge {
  readonly point: Vector3;
  /** Unit direction of the hinge line. */
  readonly axis: Vector3;
  /** Full opening angle (radians, signed): makes the face coplanar with its parent, outside it. */
  readonly angle: number;
}

export interface UnfoldingPlan {
  readonly polyhedron: Polyhedron;
  readonly net: Net;
  /** Hinge of every face; null for the base, which stays on the ground. */
  readonly hinges: readonly (Hinge | null)[];
  readonly normals: readonly Vector3[];
  /**
   * Edges worth drawing for each face, as vertex index pairs. Seams between strips of the same curved
   * surface that stay joined in the net are not real edges, so they are left out.
   */
  readonly visibleEdges: readonly (readonly [number, number][])[];
}

/** How open the solid is: 0 = closed, 1 = flat net. */
export type UnfoldPhase = 'closed' | 'opening' | 'open';

const EPSILON = 0.001;

export function unfoldPhase(openness: number): UnfoldPhase {
  if (openness <= EPSILON) return 'closed';
  if (openness >= 1 - EPSILON) return 'open';
  return 'opening';
}

export function planUnfolding(polyhedron: Polyhedron, net: Net): UnfoldingPlan {
  const normals = polyhedron.faces.map((_, f) => polyhedron.outwardNormal(f));

  const hinges = net.parent.map((p, f): Hinge | null => {
    if (p < 0) return null;
    const edge = polyhedron.sharedEdge(f, p);
    if (!edge) throw new Error(`Face ${f} and its parent ${p} share no edge`);
    const point = polyhedron.vertex(edge[0]);
    const axis = polyhedron.vertex(edge[1]).sub(point).normalize();
    // Signed angle that rotates this face's normal onto the parent's normal around the hinge.
    const angle = Math.atan2(normals[f].clone().cross(normals[p]).dot(axis), normals[f].dot(normals[p]));
    return { point, axis, angle };
  });

  const visibleEdges = polyhedron.faces.map((_, f) =>
    polyhedron.faceEdges(f).filter(([a, b]) => {
      const other = polyhedron.neighborAcross(f, a, b);
      const fakeSeam = net.joined(f, other) && polyhedron.surfaces[other] === polyhedron.surfaces[f];
      return !fakeSeam;
    }),
  );

  return { polyhedron, net, hinges, normals, visibleEdges };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Rotation of every face around its hinge for a given openness.
 * With `oneAtATime` the steps of the net open one after the other; otherwise all faces move together.
 * `ease` shapes the motion of each face (identity by default); it must map 0 → 0 and 1 → 1.
 */
export function faceAngles(
  plan: UnfoldingPlan,
  openness: number,
  oneAtATime: boolean,
  ease: (x: number) => number = (x) => x,
): number[] {
  const steps = plan.net.steps.length;
  return plan.hinges.map((hinge, f) => {
    if (!hinge) return 0;
    const local = oneAtATime ? clamp01(openness * steps - plan.net.stepOf(f)) : clamp01(openness);
    return hinge.angle * ease(local);
  });
}

/** Transform of a face relative to its parent: rotation by `angle` around the hinge line. */
export function hingeTransform(hinge: Hinge, angle: number, target = new Matrix4()): Matrix4 {
  const { x, y, z } = hinge.point;
  const rotation = new Matrix4().makeRotationAxis(hinge.axis, angle);
  return target.makeTranslation(x, y, z).multiply(rotation).multiply(new Matrix4().makeTranslation(-x, -y, -z));
}

/** Transform of every face in world space (composing the hinges from the base up). */
export function worldTransforms(plan: UnfoldingPlan, angles: readonly number[]): Matrix4[] {
  const result: (Matrix4 | undefined)[] = [];
  const resolve = (f: number): Matrix4 => {
    const cached = result[f];
    if (cached) return cached;
    const hinge = plan.hinges[f];
    const parent = plan.net.parent[f];
    const m = hinge ? resolve(parent).clone().multiply(hingeTransform(hinge, angles[f])) : new Matrix4();
    result[f] = m;
    return m;
  };
  return plan.hinges.map((_, f) => resolve(f));
}
