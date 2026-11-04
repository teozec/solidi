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

import type { Point2 } from '../domain/geometry/polygon';

/** A saved solid as plain data, before it is checked against the domain rules. */
export interface StoredSolid {
  readonly name: string;
  readonly points: readonly Point2[];
}

/** Where the child's solids are kept between visits (implemented in the infrastructure layer). */
export interface SolidStorage {
  load(): readonly StoredSolid[];
  /** Returns false if the solids could not be saved (e.g. storage disabled or full). */
  save(solids: readonly StoredSolid[]): boolean;
}

/** Keeps the solids in memory only: for tests, and as a fallback. */
export function memoryStorage(initial: readonly StoredSolid[] = []): SolidStorage {
  let solids = initial;
  return {
    load: () => solids,
    save: (next) => {
      solids = next;
      return true;
    },
  };
}
