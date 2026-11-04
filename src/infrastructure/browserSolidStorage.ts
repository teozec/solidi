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
import type { SolidStorage, StoredSolid } from '../application/solidStorage';

const KEY = 'i-solidi:saved-solids';

type WebStorage = Pick<Storage, 'getItem' | 'setItem'>;
const VERSION = 1;

/**
 * Keeps the child's solids in the browser's localStorage, so they are still there on the next visit
 * (on the same browser and computer only).
 * Never throws: storage can be disabled (private browsing, school policies) or full; even reading
 * `localStorage` can throw, so it is only touched inside try blocks.
 */
export function browserSolidStorage(getStorage: () => WebStorage | undefined = () => globalThis.localStorage): SolidStorage {
  return {
    load() {
      try {
        const raw = getStorage()?.getItem(KEY);
        return raw ? parseStoredSolids(JSON.parse(raw)) : [];
      } catch {
        return [];
      }
    },
    save(solids) {
      try {
        const storage = getStorage();
        if (!storage) return false;
        storage.setItem(KEY, JSON.stringify({ version: VERSION, solids }));
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Reads the stored JSON, keeping only entries with the expected shape. The domain checks the rest. */
export function parseStoredSolids(data: unknown): StoredSolid[] {
  if (!isRecord(data) || data.version !== VERSION || !Array.isArray(data.solids)) return [];
  return data.solids.flatMap((s: unknown) =>
    isRecord(s) && typeof s.name === 'string' && Array.isArray(s.points) && s.points.every(isPoint)
      ? [{ name: s.name, points: s.points as Point2[] }]
      : [],
  );
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

const isPoint = (p: unknown): boolean =>
  Array.isArray(p) && p.length === 2 && p.every((n) => typeof n === 'number' && Number.isFinite(n));
