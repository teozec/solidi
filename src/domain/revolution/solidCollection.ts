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

import { failure, success, type Result } from '../result';
import type { PlaneFigure } from './planeFigure';

export const MAX_NAME_LENGTH = 24;
/** Enough for a whole class, with a few attempts each. */
export const MAX_SAVED_SOLIDS = 50;

export type NameError = { readonly kind: 'emptyName' } | { readonly kind: 'nameTooLong'; readonly max: number };
export type CollectionError = NameError | { readonly kind: 'full'; readonly max: number };

/** A solid of revolution invented by the child: the figure they drew and the name they gave it. */
export interface NamedSolid {
  readonly name: string;
  readonly figure: PlaneFigure;
}

/** Trims and collapses spaces; a name must not be empty or too long. */
export function solidName(raw: string): Result<string, NameError> {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return failure({ kind: 'emptyName' });
  if ([...name].length > MAX_NAME_LENGTH) return failure({ kind: 'nameTooLong', max: MAX_NAME_LENGTH });
  return success(name);
}

/** Names are compared ignoring case: "Razzo" and "razzo" are the same solid. */
export const sameName = (a: string, b: string): boolean => a.toLocaleLowerCase('it') === b.toLocaleLowerCase('it');

/**
 * The solids saved on this computer, the most recently saved first.
 * Invariants: valid names, no two solids with the same name, at most MAX_SAVED_SOLIDS solids.
 */
export class SolidCollection {
  private constructor(readonly solids: readonly NamedSolid[]) {}

  static empty(): SolidCollection {
    return new SolidCollection([]);
  }

  /**
   * Rebuilds a collection from stored data (newest first), dropping what breaks the invariants:
   * bad names, later duplicates, solids beyond the limit.
   */
  static restore(solids: readonly NamedSolid[]): SolidCollection {
    const kept: NamedSolid[] = [];
    for (const { name: raw, figure } of solids) {
      const name = solidName(raw);
      if (!name.ok || kept.some((s) => sameName(s.name, name.value))) continue;
      if (kept.length === MAX_SAVED_SOLIDS) break;
      kept.push({ name: name.value, figure });
    }
    return new SolidCollection(kept);
  }

  get size(): number {
    return this.solids.length;
  }

  find(name: string): NamedSolid | undefined {
    return this.solids.find((s) => sameName(s.name, name));
  }

  /** Saves a solid at the top, replacing the one with the same name (the new spelling wins). */
  put(rawName: string, figure: PlaneFigure): Result<SolidCollection, CollectionError> {
    const name = solidName(rawName);
    if (!name.ok) return name;
    const others = this.solids.filter((s) => !sameName(s.name, name.value));
    if (others.length >= MAX_SAVED_SOLIDS) return failure({ kind: 'full', max: MAX_SAVED_SOLIDS });
    return success(new SolidCollection([{ name: name.value, figure }, ...others]));
  }

  remove(name: string): SolidCollection {
    return new SolidCollection(this.solids.filter((s) => !sameName(s.name, name)));
  }
}
