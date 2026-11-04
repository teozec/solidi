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

import { polyhedronCharacteristics, type Characteristics } from './characteristics';
import { prism, pyramid, regularPolygon, type BasePoint, type Unfoldable } from './factories';

export type NetSolidId = 'cube' | 'cuboid' | 'triangularPrism' | 'squarePyramid' | 'cylinder' | 'cone';

/** A solid that can be opened into its net. */
export interface CatalogNetSolid extends Unfoldable {
  readonly id: NetSolidId;
  readonly characteristics: Characteristics;
}

/** Number of strips approximating a curved lateral surface. */
const CURVE_STRIPS = 48;

const rectangle = (halfX: number, halfZ: number): BasePoint[] => [
  [halfX, halfZ],
  [-halfX, halfZ],
  [-halfX, -halfZ],
  [halfX, -halfZ],
];

const polyhedral = (id: NetSolidId, solid: Unfoldable): CatalogNetSolid => ({
  id,
  ...solid,
  characteristics: polyhedronCharacteristics(solid.polyhedron),
});

export const netCatalog: readonly CatalogNetSolid[] = [
  polyhedral('cube', prism(rectangle(1, 1), 2)),
  polyhedral('cuboid', prism(rectangle(1.5, 0.8), 1.3)),
  polyhedral('triangularPrism', prism(regularPolygon(3, 1.2), 2.2)),
  polyhedral('squarePyramid', pyramid(rectangle(1.2, 1.2), 2.2)),
  {
    id: 'cylinder',
    ...prism(regularPolygon(CURVE_STRIPS, 1), 2, { curved: true }),
    characteristics: { kind: 'curved', circularBases: 2, curvedLateralSurfaces: 1, curvedEdges: 2, vertices: 0 },
  },
  {
    id: 'cone',
    ...pyramid(regularPolygon(CURVE_STRIPS, 1.1), 2.3, { curved: true }),
    characteristics: { kind: 'curved', circularBases: 1, curvedLateralSurfaces: 1, curvedEdges: 1, vertices: 1 },
  },
];
