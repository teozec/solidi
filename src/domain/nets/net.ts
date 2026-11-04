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

import type { Polyhedron } from './polyhedron';

/**
 * A net of a polyhedron: which face stays attached to which while the solid opens up
 * (a spanning tree of the faces, rooted at the base on the ground), plus the opening order.
 *
 * `parent[f]` is the face f is attached to (-1 for the base).
 * `steps` groups the non-base faces that open together when opening "one face at a time".
 *
 * Invariants: exactly one base; every other face is attached to an adjacent face; no cycles;
 * the steps contain every non-base face exactly once.
 */
export class Net {
  private constructor(
    readonly parent: readonly number[],
    readonly steps: readonly (readonly number[])[],
  ) {}

  static create(polyhedron: Polyhedron, parent: readonly number[], steps: readonly (readonly number[])[]): Net {
    const n = polyhedron.faceCount;
    if (parent.length !== n) throw new Error('The net needs a parent for every face');
    const roots = parent.filter((p) => p === -1);
    if (roots.length !== 1) throw new Error('The net needs exactly one base face');

    parent.forEach((p, f) => {
      if (p === -1) return;
      if (!polyhedron.sharedEdge(f, p)) throw new Error(`Face ${f} is attached to face ${p}, which is not adjacent`);
      // Walking up the tree must reach the base in fewer than n steps.
      let current = f;
      for (let hops = 0; current !== -1; hops++) {
        if (hops > n) throw new Error(`Face ${f} is part of a cycle`);
        current = parent[current];
      }
    });

    const inSteps = steps.flat();
    const nonBase = parent.flatMap((p, f) => (p === -1 ? [] : [f]));
    const covered = new Set(inSteps);
    if (inSteps.length !== nonBase.length || nonBase.some((f) => !covered.has(f))) {
      throw new Error('Every non-base face must appear in exactly one step');
    }
    return new Net([...parent], steps.map((s) => [...s]));
  }

  get base(): number {
    return this.parent.indexOf(-1);
  }

  /** Index of the step in which a face opens. */
  stepOf(face: number): number {
    return this.steps.findIndex((s) => s.includes(face));
  }

  /** Are faces f and g still joined along their shared edge in the net? */
  joined(f: number, g: number): boolean {
    return this.parent[f] === g || this.parent[g] === f;
  }
}
