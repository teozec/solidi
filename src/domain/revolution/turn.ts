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

/** A full turn around the axis, in radians. */
export const FULL_TURN = 2 * Math.PI;

/** How far along its turn the figure is. `quarters` = nearest number of quarter turns (0…4). */
export type TurnPhase =
  | { readonly kind: 'start' }
  | { readonly kind: 'turning'; readonly quarters: 0 | 1 | 2 | 3 | 4 }
  | { readonly kind: 'complete' };

const EPSILON = 0.001;

/** Phase of a turn given the fraction of a full turn done so far (0…1). */
export function turnPhase(fraction: number): TurnPhase {
  if (fraction <= EPSILON) return { kind: 'start' };
  if (fraction >= 1 - EPSILON) return { kind: 'complete' };
  return { kind: 'turning', quarters: Math.round(fraction * 4) as 0 | 1 | 2 | 3 | 4 };
}

/** Angle turned so far, given the fraction of a full turn. */
export const turnAngle = (fraction: number): number => fraction * FULL_TURN;
