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

import type { Point2 } from '../geometry/polygon';
import { Net } from './net';
import { Polyhedron, type Point3 } from './polyhedron';

/** A polyhedron together with the net it opens into. */
export interface Unfoldable {
  readonly polyhedron: Polyhedron;
  readonly net: Net;
}

/** Point of a horizontal base: [x, z]. */
export type BasePoint = Point2;

/** Regular polygon in the xz plane, with side 0 facing +z (towards the viewer). */
export function regularPolygon(sides: number, radius: number): BasePoint[] {
  const rotation = Math.PI / 2 - Math.PI / sides;
  return Array.from({ length: sides }, (_, k): BasePoint => {
    const a = rotation + (2 * Math.PI * k) / sides;
    return [radius * Math.cos(a), radius * Math.sin(a)];
  });
}

/**
 * Attaches lateral strips to each other in a chain, both ways from strip 0, so that a curved
 * surface unrolls into one piece around strip 0.
 */
function chainStrips(count: number, first: number, parent: number[]) {
  const half = Math.floor(count / 2);
  for (let i = 1; i <= half; i++) parent[first + i] = first + i - 1;
  for (let i = count - 1; i > half; i--) parent[first + i] = first + ((i + 1) % count);
}

/**
 * Right prism over a base polygon. Faces: 0 = bottom base, 1 = top base, 2… = lateral faces.
 * With `curved`, the lateral faces are strips of one curved surface (a cylinder).
 */
export function prism(base: readonly BasePoint[], height: number, { curved = false } = {}): Unfoldable {
  const n = base.length;
  const vertices: Point3[] = [...base.map(([x, z]): Point3 => [x, 0, z]), ...base.map(([x, z]): Point3 => [x, height, z])];
  const faces = [
    base.map((_, i) => i),
    base.map((_, i) => n + i),
    ...base.map((_, i) => [i, (i + 1) % n, n + ((i + 1) % n), n + i]),
  ];
  const lateral = base.map((_, i) => 2 + i);
  const parent = [-1, 2];

  if (curved) {
    const polyhedron = Polyhedron.create(vertices, faces, ['bottom', 'top', ...lateral.map(() => 'lateral')]);
    parent[2] = 0;
    chainStrips(n, 2, parent);
    // First the curved surface unrolls, then the top opens, then everything lies down.
    return { polyhedron, net: Net.create(polyhedron, parent, [lateral.slice(1), [1], [2]]) };
  }

  const polyhedron = Polyhedron.create(vertices, faces);
  for (const f of lateral) parent[f] = 0;
  // First the lid opens (it is attached to lateral face 0), then the lateral faces one by one.
  return { polyhedron, net: Net.create(polyhedron, parent, [[1], ...lateral.map((f) => [f])]) };
}

/**
 * Right pyramid with its apex above the base centre. Faces: 0 = base, 1… = lateral faces.
 * With `curved`, the lateral faces are strips of one curved surface (a cone).
 */
export function pyramid(base: readonly BasePoint[], height: number, { curved = false } = {}): Unfoldable {
  const n = base.length;
  const vertices: Point3[] = [...base.map(([x, z]): Point3 => [x, 0, z]), [0, height, 0]];
  const faces = [base.map((_, i) => i), ...base.map((_, i) => [i, (i + 1) % n, n])];
  const lateral = base.map((_, i) => 1 + i);
  const parent = [-1];

  if (curved) {
    const polyhedron = Polyhedron.create(vertices, faces, ['base', ...lateral.map(() => 'lateral')]);
    parent[1] = 0;
    chainStrips(n, 1, parent);
    return { polyhedron, net: Net.create(polyhedron, parent, [lateral.slice(1), [1]]) };
  }

  const polyhedron = Polyhedron.create(vertices, faces);
  for (const f of lateral) parent[f] = 0;
  return { polyhedron, net: Net.create(polyhedron, parent, lateral.map((f) => [f])) };
}
