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
import { failure, success, type Result } from '../domain/result';
import { revolutionCatalog, type RevolutionSolidId } from '../domain/revolution/catalog';
import { PlaneFigure, type FigureError } from '../domain/revolution/planeFigure';
import { type CollectionError, SolidCollection, solidName } from '../domain/revolution/solidCollection';
import { Playback } from './playback';
import type { SolidStorage } from './solidStorage';
import { Store } from './store';

export type RevolutionSelection =
  | { readonly kind: 'catalog'; readonly id: RevolutionSolidId }
  /** A figure drawn by the child (saved or not). */
  | { readonly kind: 'custom' };

export type SaveError =
  | CollectionError
  /** Another saved solid has this name: save again with `replace` to overwrite it. */
  | { readonly kind: 'nameTaken'; readonly name: string }
  /** The drawing is not a valid plane figure yet. */
  | { readonly kind: 'nothingToSave' }
  | { readonly kind: 'storageFailed' };

/** The figure the child is drawing, whether it is a valid plane figure yet, and the name typed for it. */
export interface Draft {
  readonly points: readonly Point2[];
  readonly check: Result<PlaneFigure, FigureError>;
  /** As typed: checked only when saving. */
  readonly name: string;
}

export interface RevolutionState {
  readonly selection: RevolutionSelection;
  /** The figure turning in the 3D view (for a custom selection: the last one spun). */
  readonly figure: PlaneFigure;
  /** Name of the custom figure turning in the 3D view, if it was given a valid one. */
  readonly figureName: string | null;
  readonly drawing: boolean;
  readonly draft: Draft;
  /** Show the generated solid filled instead of see-through. */
  readonly filled: boolean;
  /** Solids saved on this computer, kept between visits. */
  readonly collection: SolidCollection;
}

const emptyDraft: Draft = { points: [], check: PlaneFigure.create([]), name: '' };

/** Use cases of the "solids of revolution" page. The turn itself is driven by `playback` (t = fraction of a turn). */
export class RevolutionPage extends Store<RevolutionState> {
  readonly playback = new Playback(6);

  constructor(private readonly storage: SolidStorage) {
    const first = revolutionCatalog[0];
    super({
      selection: { kind: 'catalog', id: first.id },
      figure: first.figure,
      figureName: null,
      drawing: false,
      draft: emptyDraft,
      filled: false,
      collection: loadCollection(storage),
    });
  }

  get catalog() {
    return revolutionCatalog;
  }

  selectSolid(id: RevolutionSolidId): void {
    const entry = revolutionCatalog.find((s) => s.id === id);
    if (!entry) throw new Error(`Unknown solid ${id}`);
    this.update({ selection: { kind: 'catalog', id }, figure: entry.figure, figureName: null, drawing: false });
    this.playback.seek(0);
  }

  /** Opens the drawing sheet, keeping the previous drawing. */
  startDrawing(): void {
    this.playback.pause();
    this.update({ selection: { kind: 'custom' }, drawing: true });
  }

  updateDraft(points: readonly Point2[]): void {
    this.update({ draft: { ...this.state.draft, points: [...points], check: PlaneFigure.create(points) } });
  }

  renameDraft(name: string): void {
    this.update({ draft: { ...this.state.draft, name } });
  }

  /** Puts a saved solid on the drawing sheet, to change it or spin it. */
  loadSaved(name: string): void {
    const solid = this.state.collection.find(name);
    if (!solid) throw new Error(`Unknown saved solid ${name}`);
    this.playback.pause();
    this.update({
      selection: { kind: 'custom' },
      drawing: true,
      draft: { points: solid.figure.vertices, check: success(solid.figure), name: solid.name },
    });
  }

  /** Turns the drawn figure into the figure shown in 3D. Does nothing if the drawing is not valid. */
  spinDraft(): void {
    const { check, name } = this.state.draft;
    if (!check.ok) return;
    const validName = solidName(name);
    this.update({ figure: check.value, figureName: validName.ok ? validName.value : null, drawing: false });
    this.playback.seek(0);
  }

  setFilled(filled: boolean): void {
    this.update({ filled });
  }

  /** Saves the drawing under the name typed for it. Returns the name as saved. */
  saveDraft({ replace = false } = {}): Result<string, SaveError> {
    const { draft, collection } = this.state;
    if (!draft.check.ok) return failure({ kind: 'nothingToSave' });
    const name = solidName(draft.name);
    if (!name.ok) return name;
    const existing = collection.find(name.value);
    if (existing && !replace) return failure({ kind: 'nameTaken', name: existing.name });
    const next = collection.put(name.value, draft.check.value);
    if (!next.ok) return next;
    if (!this.storage.save(toStored(next.value))) return failure({ kind: 'storageFailed' });
    this.update({ collection: next.value, draft: { ...draft, name: name.value } });
    return success(name.value);
  }

  deleteSaved(name: string): void {
    const next = this.state.collection.remove(name);
    this.storage.save(toStored(next));
    this.update({ collection: next });
  }
}

function loadCollection(storage: SolidStorage): SolidCollection {
  const solids = storage.load().flatMap(({ name, points }) => {
    const figure = PlaneFigure.create(points);
    return figure.ok ? [{ name, figure: figure.value }] : [];
  });
  return SolidCollection.restore(solids);
}

const toStored = (collection: SolidCollection) =>
  collection.solids.map(({ name, figure }) => ({ name, points: figure.vertices }));
