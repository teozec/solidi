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

import { describe, expect, it } from 'vitest';
import { browserSolidStorage, parseStoredSolids } from './browserSolidStorage';

/** In-memory stand-in for localStorage. */
function fakeStorage() {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
}

describe('browserSolidStorage', () => {
  it('saves and loads the solids', () => {
    const fake = fakeStorage();
    const solids = [{ name: 'Razzo', points: [[0, 0], [1, 0], [0, 2]] as [number, number][] }];
    expect(browserSolidStorage(() => fake).save(solids)).toBe(true);
    expect(browserSolidStorage(() => fake).load()).toEqual(solids);
  });

  it('never throws when storage is missing, broken or full', () => {
    const throwing = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(browserSolidStorage(() => throwing).load()).toEqual([]);
    expect(browserSolidStorage(() => throwing).save([])).toBe(false);
    const blocked = () => {
      throw new Error('SecurityError: access to localStorage is denied');
    };
    expect(browserSolidStorage(blocked).load()).toEqual([]);
    expect(browserSolidStorage(blocked).save([])).toBe(false);
    expect(browserSolidStorage(() => undefined).load()).toEqual([]);
    expect(browserSolidStorage(() => undefined).save([])).toBe(false);
  });

  it('ignores data that is not valid JSON', () => {
    const fake = fakeStorage();
    fake.items.set('i-solidi:saved-solids', '{not json');
    expect(browserSolidStorage(() => fake).load()).toEqual([]);
  });
});

describe('parseStoredSolids', () => {
  it('keeps only entries with the expected shape', () => {
    const data = {
      version: 1,
      solids: [
        { name: 'Razzo', points: [[0, 0], [1, 0], [0, 2]] },
        { name: 42, points: [] },
        { name: 'Senza punti' },
        { name: 'Punti strani', points: [[0, 'a']] },
        { name: 'Infinito', points: [[0, Number.POSITIVE_INFINITY]] },
        null,
      ],
    };
    expect(parseStoredSolids(data)).toEqual([{ name: 'Razzo', points: [[0, 0], [1, 0], [0, 2]] }]);
  });

  it('ignores unknown versions and shapes', () => {
    expect(parseStoredSolids({ version: 2, solids: [] })).toEqual([]);
    expect(parseStoredSolids([])).toEqual([]);
    expect(parseStoredSolids(null)).toEqual([]);
  });
});
