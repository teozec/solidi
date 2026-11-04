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

// Shared geometry kernel: plane points and simple-polygon checks.

export type Point2 = readonly [number, number];

/** z component of (a - o) × (b - o): > 0 if o→a→b turns left, 0 if collinear. */
export const cross = (o: Point2, a: Point2, b: Point2): number =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

const withinBox = (p: Point2, a: Point2, b: Point2): boolean =>
  Math.min(a[0], b[0]) <= p[0] &&
  p[0] <= Math.max(a[0], b[0]) &&
  Math.min(a[1], b[1]) <= p[1] &&
  p[1] <= Math.max(a[1], b[1]);

/** Do segments ab and cd touch or cross? */
export function segmentsTouch(a: Point2, b: Point2, c: Point2, d: Point2): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  return (
    (d1 === 0 && withinBox(a, c, d)) ||
    (d2 === 0 && withinBox(b, c, d)) ||
    (d3 === 0 && withinBox(c, a, b)) ||
    (d4 === 0 && withinBox(d, a, b))
  );
}

export const allCollinear = (points: readonly Point2[]): boolean =>
  points.every((p) => cross(points[0], points[1], p) === 0);

/**
 * Sides of the closed polygon that touch a side they should not.
 * Side i goes from point i to point i+1 (the last one closes the polygon).
 */
export function crossingSides(points: readonly Point2[]): Set<number> {
  const bad = new Set<number>();
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const a = points[i];
    const b = points[(i + 1) % n];
    for (let j = i + 1; j < n; j++) {
      const c = points[j];
      const d = points[(j + 1) % n];
      const adjacent = j === i + 1 || (i === 0 && j === n - 1);
      if (adjacent) {
        // Consecutive sides only clash if the path doubles back over itself.
        const shared = j === i + 1 ? b : a;
        const p = j === i + 1 ? a : b;
        const q = j === i + 1 ? d : c;
        const ux = p[0] - shared[0];
        const uy = p[1] - shared[1];
        const vx = q[0] - shared[0];
        const vy = q[1] - shared[1];
        if (ux * vy - uy * vx === 0 && ux * vx + uy * vy > 0) bad.add(i).add(j);
      } else if (segmentsTouch(a, b, c, d)) {
        bad.add(i).add(j);
      }
    }
  }
  return bad;
}
