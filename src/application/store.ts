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

/** Minimal observable state holder for the application layer. */
export class Store<S> {
  private readonly listeners = new Set<(state: S) => void>();

  constructor(private current: S) {}

  get state(): S {
    return this.current;
  }

  /** Calls `listener` on every change; returns a function that unsubscribes. */
  subscribe(listener: (state: S) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected update(patch: Partial<S>): void {
    this.current = { ...this.current, ...patch };
    this.notify();
  }

  protected notify(): void {
    for (const listener of this.listeners) listener(this.current);
  }
}
