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

import { netCatalog, type CatalogNetSolid, type NetSolidId } from '../domain/nets/catalog';
import { faceAngles, planUnfolding, type UnfoldingPlan } from '../domain/nets/unfolding';
import { Playback } from './playback';
import { Store } from './store';

export interface NetsState {
  readonly solid: CatalogNetSolid;
  readonly plan: UnfoldingPlan;
  /** Open the faces one step at a time instead of all together. */
  readonly oneAtATime: boolean;
}

/** Use cases of the "nets" page. How open the solid is is driven by `playback` (t = openness). */
export class NetsPage extends Store<NetsState> {
  readonly playback = new Playback(7);
  private readonly plans = new Map<NetSolidId, UnfoldingPlan>();

  constructor() {
    const first = netCatalog[0];
    super({ solid: first, plan: planUnfolding(first.polyhedron, first.net), oneAtATime: true });
    this.plans.set(first.id, this.state.plan);
  }

  get catalog() {
    return netCatalog;
  }

  selectSolid(id: NetSolidId): void {
    const solid = netCatalog.find((s) => s.id === id);
    if (!solid) throw new Error(`Unknown solid ${id}`);
    let plan = this.plans.get(id);
    if (!plan) {
      plan = planUnfolding(solid.polyhedron, solid.net);
      this.plans.set(id, plan);
    }
    this.playback.pause();
    this.update({ solid, plan });
    this.playback.seek(0);
  }

  setOneAtATime(oneAtATime: boolean): void {
    this.update({ oneAtATime });
  }

  /** Rotation of every face for the current openness. */
  faceAngles(ease?: (x: number) => number): number[] {
    return faceAngles(this.state.plan, this.playback.state.t, this.state.oneAtATime, ease);
  }
}
