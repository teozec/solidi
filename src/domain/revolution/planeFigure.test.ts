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
import type { Point2 } from '../geometry/polygon';
import { revolutionCatalog } from './catalog';
import { PlaneFigure } from './planeFigure';
import { turnPhase } from './turn';

function figureOf(id: string) {
  const solid = revolutionCatalog.find((s) => s.id === id);
  if (!solid) throw new Error(`No solid ${id} in the catalog`);
  return solid.figure;
}

const errorOf = (points: Point2[]) => {
  const r = PlaneFigure.create(points);
  return r.ok ? null : r.error;
};

describe('PlaneFigure.create', () => {
  const valid: [string, Point2[]][] = [
    ['rectangle', [[0, 0], [4, 0], [4, 8], [0, 8]]],
    ['triangle', [[0, 0], [4, 0], [0, 8]]],
    ['steps', [[0, 0], [5, 0], [5, 4], [3, 4], [3, 9], [0, 9]]],
    ['away from the axis', [[3, 2], [6, 2], [6, 6], [3, 6]]],
    ['concave', [[0, 0], [6, 0], [6, 6], [3, 2], [0, 6]]],
  ];
  for (const [name, points] of valid) {
    it(`accepts a ${name} figure`, () => expect(errorOf(points)).toBeNull());
  }

  it('needs at least 3 points', () => {
    expect(errorOf([[0, 0], [4, 0]])).toEqual({ kind: 'tooFewPoints', missing: 1 });
  });

  it('rejects collinear points', () => {
    expect(errorOf([[0, 0], [2, 2], [4, 4]])).toEqual({ kind: 'collinear' });
  });

  it('rejects a bow-tie as crossing, even though its signed area is zero', () => {
    expect(errorOf([[1, 1], [5, 5], [5, 1], [1, 5]])).toEqual({ kind: 'crossingSides', sides: new Set([0, 2]) });
  });

  it('rejects a side that doubles back over the previous one', () => {
    expect(errorOf([[0, 0], [4, 0], [2, 0], [2, 5]])).toMatchObject({ kind: 'crossingSides' });
  });

  it('rejects a vertex lying on another side', () => {
    expect(errorOf([[0, 0], [6, 0], [6, 6], [3, 0], [0, 6]])).toMatchObject({ kind: 'crossingSides' });
  });

  it('rejects points left of the axis', () => {
    expect(errorOf([[-1, 0], [4, 0], [0, 8]])).toEqual({ kind: 'leftOfAxis' });
  });
});

describe('PlaneFigure behaviour', () => {
  it('generates a solid with a hole when it does not touch the axis', () => {
    expect(PlaneFigure.of([[3, 2], [6, 2], [6, 6], [3, 6]]).generatesSolidWithHole()).toBe(true);
    expect(PlaneFigure.of([[0, 0], [4, 0], [0, 8]]).generatesSolidWithHole()).toBe(false);
  });

  it('follows the vertices off the axis, without duplicates', () => {
    const cylinder = figureOf('cylinder');
    expect(cylinder.trailPoints()).toEqual([[1.2, 0], [1.2, 2.4]]);
  });

  it('follows only the farthest point of a curved figure', () => {
    const sphere = figureOf('sphere');
    expect(sphere.trailPoints()).toHaveLength(1);
    expect(sphere.trailPoints()[0][0]).toBeCloseTo(1.4);
  });

  it('skips the sides lying on the axis when sweeping a surface', () => {
    const cylinder = figureOf('cylinder');
    expect(cylinder.sides).toHaveLength(4);
    expect(cylinder.sweepingSides).toHaveLength(3);
  });
});

describe('turnPhase', () => {
  it('names start, quarter turns and the complete turn', () => {
    expect(turnPhase(0)).toEqual({ kind: 'start' });
    expect(turnPhase(0.26)).toEqual({ kind: 'turning', quarters: 1 });
    expect(turnPhase(0.5)).toEqual({ kind: 'turning', quarters: 2 });
    expect(turnPhase(1)).toEqual({ kind: 'complete' });
  });
});
