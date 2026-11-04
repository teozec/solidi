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
import { PlaneFigure } from './planeFigure';
import { MAX_NAME_LENGTH, MAX_SAVED_SOLIDS, SolidCollection, solidName } from './solidCollection';

const figure = PlaneFigure.of([[0, 0], [1, 0], [0, 2]]);
const other = PlaneFigure.of([[0, 0], [1, 0], [1, 1], [0, 1]]);

/** A collection listing `names` from the newest to the oldest. */
function collectionOf(...names: string[]): SolidCollection {
  return SolidCollection.restore(names.map((name) => ({ name, figure })));
}

describe('solidName', () => {
  it('trims and collapses spaces', () => {
    expect(solidName('  la   mia  trottola ')).toEqual({ ok: true, value: 'la mia trottola' });
  });

  it('rejects empty and too long names', () => {
    expect(solidName('   ')).toEqual({ ok: false, error: { kind: 'emptyName' } });
    expect(solidName('a'.repeat(MAX_NAME_LENGTH)).ok).toBe(true);
    expect(solidName('a'.repeat(MAX_NAME_LENGTH + 1))).toEqual({ ok: false, error: { kind: 'nameTooLong', max: MAX_NAME_LENGTH } });
  });

  it('counts an emoji as one character', () => {
    expect(solidName('🚀'.repeat(MAX_NAME_LENGTH)).ok).toBe(true);
  });
});

describe('SolidCollection', () => {
  it('puts the newest solid first and finds solids ignoring case', () => {
    const result = collectionOf('Razzo').put('Trottola', other);
    if (!result.ok) throw new Error(result.error.kind);
    expect(result.value.solids.map((s) => s.name)).toEqual(['Trottola', 'Razzo']);
    expect(result.value.find('RAZZO')?.name).toBe('Razzo');
    expect(result.value.find('Vaso')).toBeUndefined();
  });

  it('replaces a solid with the same name and moves it to the top', () => {
    const result = collectionOf('Trottola', 'Razzo').put('razzo', other);
    if (!result.ok) throw new Error(result.error.kind);
    expect(result.value.solids.map((s) => s.name)).toEqual(['razzo', 'Trottola']);
    expect(result.value.find('Razzo')?.figure).toBe(other);
  });

  it('refuses a new solid when full, but still allows replacing one', () => {
    const names = Array.from({ length: MAX_SAVED_SOLIDS }, (_, i) => `Solido ${i + 1}`);
    const full = collectionOf(...names);
    expect(full.put('Uno in più', figure)).toEqual({ ok: false, error: { kind: 'full', max: MAX_SAVED_SOLIDS } });
    expect(full.put('Solido 1', other).ok).toBe(true);
  });

  it('removes a solid by name', () => {
    expect(collectionOf('Razzo', 'Trottola').remove('razzo').solids.map((s) => s.name)).toEqual(['Trottola']);
  });

  it('restores stored data dropping bad names, duplicates and extras', () => {
    const many = Array.from({ length: MAX_SAVED_SOLIDS + 3 }, (_, i) => `S${i}`);
    const c = collectionOf('', 'Razzo', 'razzo', ...many);
    expect(c.size).toBe(MAX_SAVED_SOLIDS);
    expect(c.solids[0].name).toBe('Razzo');
  });
});
