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

import { PlaneFigure, semicircle } from './planeFigure';

export type RevolutionSolidId = 'cylinder' | 'cone' | 'sphere' | 'frustum';

/** A ready-made solid of revolution: the plane figure whose full turn generates it. */
export interface CatalogSolidOfRevolution {
  readonly id: RevolutionSolidId;
  readonly figure: PlaneFigure;
}

export const revolutionCatalog: readonly CatalogSolidOfRevolution[] = [
  // rectangle turning around one of its sides
  { id: 'cylinder', figure: PlaneFigure.of([[0, 0], [1.2, 0], [1.2, 2.4], [0, 2.4]]) },
  // right triangle turning around one of its legs
  { id: 'cone', figure: PlaneFigure.of([[0, 0], [1.4, 0], [0, 2.6]]) },
  // semicircle turning around its diameter
  { id: 'sphere', figure: PlaneFigure.of(semicircle(1.4), { curved: true }) },
  // right trapezoid turning around the side with the right angles
  { id: 'frustum', figure: PlaneFigure.of([[0, 0], [1.5, 0], [0.8, 2.2], [0, 2.2]]) },
];
