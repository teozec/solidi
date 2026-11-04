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
 * What children learn to count on a solid.
 * Polyhedra: faces, edges, vertices. Curved solids (cylinder, cone): bases, a curved lateral
 * surface, curved edges and vertices.
 */
export type Characteristics =
  | { readonly kind: 'polyhedron'; readonly faces: number; readonly edges: number; readonly vertices: number }
  | {
      readonly kind: 'curved';
      readonly circularBases: number;
      readonly curvedLateralSurfaces: number;
      readonly curvedEdges: number;
      readonly vertices: number;
    };

export const polyhedronCharacteristics = (p: Polyhedron): Characteristics => ({
  kind: 'polyhedron',
  faces: p.faceCount,
  edges: p.edgeCount,
  vertices: p.vertexCount,
});
