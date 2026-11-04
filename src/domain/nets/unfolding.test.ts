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

import type { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { netCatalog } from './catalog';
import { prism } from './factories';
import { Net } from './net';
import { Polyhedron } from './polyhedron';
import { faceAngles, planUnfolding, unfoldPhase, worldTransforms, type UnfoldingPlan } from './unfolding';

type Triangle = [number, number][];

/** Faces in world space at the given openness, projected on the ground as triangles. */
function layout(plan: UnfoldingPlan, openness: number, oneAtATime: boolean) {
  const transforms = worldTransforms(plan, faceAngles(plan, openness, oneAtATime));
  let maxHeight = 0;
  const triangles: Triangle[] = [];
  plan.polyhedron.faces.forEach((_, f) => {
    const pts = plan.polyhedron.facePoints(f).map((p: Vector3) => p.applyMatrix4(transforms[f]));
    for (const p of pts) maxHeight = Math.max(maxHeight, Math.abs(p.y));
    for (let i = 1; i < pts.length - 1; i++) {
      triangles.push([pts[0], pts[i], pts[i + 1]].map((p): [number, number] => [p.x, p.z]));
    }
  });
  return { maxHeight, triangles };
}

const strictlyInside = (x: number, z: number, [p, q, r]: Triangle) => {
  const s1 = (q[0] - p[0]) * (z - p[1]) - (q[1] - p[1]) * (x - p[0]);
  const s2 = (r[0] - q[0]) * (z - q[1]) - (r[1] - q[1]) * (x - q[0]);
  const s3 = (p[0] - r[0]) * (z - r[1]) - (p[1] - r[1]) * (x - r[0]);
  const e = 1e-9;
  return (s1 > e && s2 > e && s3 > e) || (s1 < -e && s2 < -e && s3 < -e);
};

/** Samples a grid over the net and counts points covered by more than one face. */
function overlapSamples(triangles: Triangle[]): number {
  const xs = triangles.flat().map((p) => p[0]);
  const zs = triangles.flat().map((p) => p[1]);
  let overlaps = 0;
  for (let x = Math.min(...xs); x < Math.max(...xs); x += 0.05) {
    for (let z = Math.min(...zs); z < Math.max(...zs); z += 0.05) {
      if (triangles.filter((t) => strictlyInside(x, z, t)).length > 1) overlaps++;
    }
  }
  return overlaps;
}

function netSolid(id: string) {
  const solid = netCatalog.find((s) => s.id === id);
  if (!solid) throw new Error(`No solid ${id} in the catalog`);
  return solid;
}

describe('unfolding the catalog solids', () => {
  for (const solid of netCatalog) {
    for (const oneAtATime of [true, false]) {
      it(`${solid.id} lies flat on the ground without overlaps (oneAtATime=${oneAtATime})`, () => {
        const plan = planUnfolding(solid.polyhedron, solid.net);
        const { maxHeight, triangles } = layout(plan, 1, oneAtATime);
        expect(maxHeight).toBeLessThan(1e-6);
        expect(overlapSamples(triangles)).toBe(0);
      });
    }

    it(`${solid.id} is closed when openness is 0`, () => {
      const plan = planUnfolding(solid.polyhedron, solid.net);
      expect(faceAngles(plan, 0, true).every((a) => a === 0)).toBe(true);
    });
  }
});

describe('characteristics', () => {
  const byId = Object.fromEntries(netCatalog.map((s) => [s.id, s.characteristics]));

  it('counts faces, edges and vertices of polyhedra', () => {
    expect(byId.cube).toEqual({ kind: 'polyhedron', faces: 6, edges: 12, vertices: 8 });
    expect(byId.cuboid).toEqual({ kind: 'polyhedron', faces: 6, edges: 12, vertices: 8 });
    expect(byId.triangularPrism).toEqual({ kind: 'polyhedron', faces: 5, edges: 9, vertices: 6 });
    expect(byId.squarePyramid).toEqual({ kind: 'polyhedron', faces: 5, edges: 8, vertices: 5 });
  });

  it('describes curved solids by their bases and curved surface, not by their strips', () => {
    expect(byId.cylinder).toMatchObject({ kind: 'curved', circularBases: 2, curvedEdges: 2, vertices: 0 });
    expect(byId.cone).toMatchObject({ kind: 'curved', circularBases: 1, curvedEdges: 1, vertices: 1 });
  });
});

describe('visible edges', () => {
  it('hides the seams between strips of a curved surface, but keeps the cut', () => {
    const cylinder = netSolid('cylinder');
    const plan = planUnfolding(cylinder.polyhedron, cylinder.net);
    const lateralVertical = plan.visibleEdges.slice(2).flat().filter(([a, b]) => Math.abs(a - b) === 48);
    // Only the two sides of the cut remain among the vertical edges of the lateral surface.
    expect(lateralVertical).toHaveLength(2);
  });
});

describe('invariants', () => {
  it('rejects a polyhedron that is not closed', () => {
    const open = prism([[1, 1], [-1, 1], [-1, -1], [1, -1]], 2).polyhedron;
    expect(() => Polyhedron.create(open.vertices, open.faces.slice(1))).toThrow(/not closed/);
  });

  it('rejects a net that attaches a face to a non-adjacent face', () => {
    const { polyhedron } = prism([[1, 1], [-1, 1], [-1, -1], [1, -1]], 2);
    // face 1 (top) attached to face 0 (bottom): they share no edge
    expect(() => Net.create(polyhedron, [-1, 0, 0, 0, 0, 0], [[1], [2], [3], [4], [5]])).toThrow(/not adjacent/);
  });

  it('rejects a net whose steps miss a face', () => {
    const { polyhedron } = prism([[1, 1], [-1, 1], [-1, -1], [1, -1]], 2);
    expect(() => Net.create(polyhedron, [-1, 2, 0, 0, 0, 0], [[1], [2], [3]])).toThrow(/exactly one step/);
  });
});

describe('unfoldPhase', () => {
  it('names the phases of opening', () => {
    expect(unfoldPhase(0)).toBe('closed');
    expect(unfoldPhase(0.5)).toBe('opening');
    expect(unfoldPhase(1)).toBe('open');
  });
});
