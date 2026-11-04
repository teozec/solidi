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

import { allCollinear, crossingSides, type Point2 } from '../geometry/polygon';
import { failure, success, type Result } from '../result';

/**
 * Why a set of points is not a valid plane figure.
 * `sides` are indices of offending sides (side i goes from point i to point i+1).
 */
export type FigureError =
  | { readonly kind: 'tooFewPoints'; readonly missing: number }
  | { readonly kind: 'collinear' }
  | { readonly kind: 'crossingSides'; readonly sides: ReadonlySet<number> }
  | { readonly kind: 'leftOfAxis' };

export interface FigureOptions {
  /** The figure approximates a curved outline (e.g. a semicircle). */
  curved?: boolean;
}

/**
 * A plane figure that can turn around the axis (the line x = 0).
 * Coordinates are [x, y]: x = distance from the axis, y = height.
 *
 * Invariants: at least 3 vertices, not all collinear, no crossing sides, nothing left of the axis.
 */
export class PlaneFigure {
  private constructor(
    readonly vertices: readonly Point2[],
    readonly curved: boolean,
  ) {}

  static create(points: readonly Point2[], { curved = false }: FigureOptions = {}): Result<PlaneFigure, FigureError> {
    if (points.length < 3) return failure({ kind: 'tooFewPoints', missing: 3 - points.length });
    if (points.some(([x]) => x < 0)) return failure({ kind: 'leftOfAxis' });
    if (allCollinear(points)) return failure({ kind: 'collinear' });
    const sides = crossingSides(points);
    if (sides.size) return failure({ kind: 'crossingSides', sides });
    return success(new PlaneFigure([...points], curved));
  }

  /** Like `create`, for figures known to be valid (catalog data): throws otherwise. */
  static of(points: readonly Point2[], options?: FigureOptions): PlaneFigure {
    const result = PlaneFigure.create(points, options);
    if (!result.ok) throw new Error(`Invalid plane figure: ${result.error.kind}`);
    return result.value;
  }

  /** Sides as pairs of points, including the closing side. */
  get sides(): [Point2, Point2][] {
    return this.vertices.map((p, i) => [p, this.vertices[(i + 1) % this.vertices.length]]);
  }

  /** Sides that sweep a surface when turning (a side lying on the axis sweeps nothing). */
  get sweepingSides(): [Point2, Point2][] {
    return this.sides.filter(([a, b]) => a[0] !== 0 || b[0] !== 0);
  }

  touchesAxis(): boolean {
    return this.vertices.some(([x]) => x === 0);
  }

  /** A figure that does not touch the axis generates a solid with a hole through it. */
  generatesSolidWithHole(): boolean {
    return !this.touchesAxis();
  }

  /**
   * Points whose circular path is worth showing while the figure turns: the vertices off the axis,
   * or, for a curved figure, only the point(s) farthest from the axis.
   */
  trailPoints(): Point2[] {
    let candidates = this.vertices.filter(([x]) => x > 0);
    if (this.curved) {
      const max = Math.max(...candidates.map(([x]) => x));
      candidates = candidates.filter(([x]) => x === max);
    }
    const unique = new Map(candidates.map((p) => [p.join(','), p]));
    return [...unique.values()];
  }
}

/** Semicircle with its diameter on the axis, from (0, 0) to (0, 2r). */
export function semicircle(r: number, segments = 48): Point2[] {
  return Array.from({ length: segments + 1 }, (_, i): Point2 => {
    const a = -Math.PI / 2 + (Math.PI * i) / segments;
    const x = r * Math.cos(a);
    // Endpoints must lie exactly on the axis, not 1e-17 away from it.
    return [Math.abs(x) < 1e-9 ? 0 : x, r + r * Math.sin(a)];
  });
}
