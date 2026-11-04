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

import { Vector3 } from 'three';

export type Point3 = readonly [number, number, number];

const edgeKey = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/**
 * A closed solid with flat convex faces, resting on the plane y = 0.
 *
 * `surfaces` tells which surface each face belongs to: faces of the same surface are pieces of a
 * single curved surface (e.g. the strips approximating a cylinder's side). By default every face
 * is its own surface.
 *
 * Invariants: every face has at least 3 vertices, every edge is shared by exactly 2 faces.
 */
export class Polyhedron {
  /** Edge key ("a-b" with a < b) → indices of the two faces sharing it. */
  private readonly edgeFaces: ReadonlyMap<string, readonly number[]>;

  private constructor(
    readonly vertices: readonly Point3[],
    readonly faces: readonly (readonly number[])[],
    readonly surfaces: readonly string[],
  ) {
    const map = new Map<string, number[]>();
    faces.forEach((face, fi) => {
      face.forEach((a, i) => {
        const key = edgeKey(a, face[(i + 1) % face.length]);
        map.set(key, [...(map.get(key) ?? []), fi]);
      });
    });
    this.edgeFaces = map;
  }

  static create(vertices: readonly Point3[], faces: readonly (readonly number[])[], surfaces?: readonly string[]): Polyhedron {
    if (faces.some((f) => f.length < 3)) throw new Error('Every face needs at least 3 vertices');
    if (surfaces && surfaces.length !== faces.length) throw new Error('One surface per face is required');
    const p = new Polyhedron(vertices, faces, surfaces ?? faces.map((_, i) => `face${i}`));
    for (const [key, list] of p.edgeFaces) {
      if (list.length !== 2) throw new Error(`Edge ${key} is shared by ${list.length} faces: the polyhedron is not closed`);
    }
    return p;
  }

  get faceCount(): number {
    return this.faces.length;
  }

  get edgeCount(): number {
    return this.edgeFaces.size;
  }

  get vertexCount(): number {
    return this.vertices.length;
  }

  vertex(i: number): Vector3 {
    return new Vector3(...this.vertices[i]);
  }

  facePoints(face: number): Vector3[] {
    return this.faces[face].map((i) => this.vertex(i));
  }

  centroid(): Vector3 {
    const c = new Vector3();
    for (const v of this.vertices) c.add(new Vector3(...v));
    return c.divideScalar(this.vertices.length);
  }

  /** Unit normal of a face, pointing out of the solid (Newell's method). */
  outwardNormal(face: number): Vector3 {
    const pts = this.facePoints(face);
    const n = new Vector3();
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      n.x += (p.y - q.y) * (p.z + q.z);
      n.y += (p.z - q.z) * (p.x + q.x);
      n.z += (p.x - q.x) * (p.y + q.y);
    });
    n.normalize();
    const center = pts.reduce((acc, p) => acc.add(p), new Vector3()).divideScalar(pts.length);
    if (n.dot(center.sub(this.centroid())) < 0) n.negate();
    return n;
  }

  /** The two vertex indices of the edge shared by two faces, or null if they are not adjacent. */
  sharedEdge(f: number, g: number): [number, number] | null {
    const common = this.faces[f].filter((v) => this.faces[g].includes(v));
    return common.length === 2 ? [common[0], common[1]] : null;
  }

  /** The face on the other side of edge (a, b) from `face`. */
  neighborAcross(face: number, a: number, b: number): number {
    const list = this.edgeFaces.get(edgeKey(a, b)) ?? [];
    return list[0] === face ? list[1] : list[0];
  }

  /** Edges of a face as vertex index pairs, in order. */
  faceEdges(face: number): [number, number][] {
    const f = this.faces[face];
    return f.map((a, i) => [a, f[(i + 1) % f.length]]);
  }
}
