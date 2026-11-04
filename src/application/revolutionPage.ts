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
import type { Result } from '../domain/result';
import { revolutionCatalog, type RevolutionSolidId } from '../domain/revolution/catalog';
import { PlaneFigure, type FigureError } from '../domain/revolution/planeFigure';
import { Playback } from './playback';
import { Store } from './store';

export type RevolutionSelection = { readonly kind: 'catalog'; readonly id: RevolutionSolidId } | { readonly kind: 'custom' };

/** The figure the child is drawing, and whether it is a valid plane figure yet. */
export interface Draft {
  readonly points: readonly Point2[];
  readonly check: Result<PlaneFigure, FigureError>;
}

export interface RevolutionState {
  readonly selection: RevolutionSelection;
  /** The figure turning in the 3D view (for a custom selection: the last one spun). */
  readonly figure: PlaneFigure;
  readonly drawing: boolean;
  readonly draft: Draft;
  /** Show the generated solid filled instead of see-through. */
  readonly filled: boolean;
}

const emptyDraft: Draft = { points: [], check: PlaneFigure.create([]) };

/** Use cases of the "solids of revolution" page. The turn itself is driven by `playback` (t = fraction of a turn). */
export class RevolutionPage extends Store<RevolutionState> {
  readonly playback = new Playback(6);

  constructor() {
    const first = revolutionCatalog[0];
    super({ selection: { kind: 'catalog', id: first.id }, figure: first.figure, drawing: false, draft: emptyDraft, filled: false });
  }

  get catalog() {
    return revolutionCatalog;
  }

  selectSolid(id: RevolutionSolidId): void {
    const entry = revolutionCatalog.find((s) => s.id === id);
    if (!entry) throw new Error(`Unknown solid ${id}`);
    this.update({ selection: { kind: 'catalog', id }, figure: entry.figure, drawing: false });
    this.playback.seek(0);
  }

  /** Opens the drawing sheet, keeping the previous drawing. */
  startDrawing(): void {
    this.playback.pause();
    this.update({ selection: { kind: 'custom' }, drawing: true });
  }

  updateDraft(points: readonly Point2[]): void {
    this.update({ draft: { points: [...points], check: PlaneFigure.create(points) } });
  }

  /** Turns the drawn figure into the figure shown in 3D. Does nothing if the drawing is not valid. */
  spinDraft(): void {
    const { check } = this.state.draft;
    if (!check.ok) return;
    this.update({ figure: check.value, drawing: false });
    this.playback.seek(0);
  }

  setFilled(filled: boolean): void {
    this.update({ filled });
  }
}
