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

import { Store } from './store';

/** -1 = playing backwards, 0 = stopped, 1 = playing forwards. */
export type Direction = -1 | 0 | 1;

export interface PlaybackState {
  /** Position in the animation, 0…1. */
  readonly t: number;
  readonly direction: Direction;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * Play / pause / seek over an animation parameter t ∈ [0, 1].
 * Time is pushed in from outside with `advance(seconds)`, so this has no timers and is easy to test.
 */
export class Playback extends Store<PlaybackState> {
  private readonly finishedListeners = new Set<() => void>();

  /** @param duration seconds for a full run from 0 to 1 */
  constructor(private readonly duration: number) {
    super({ t: 0, direction: 0 });
  }

  /** Called when playing forwards reaches the end. */
  onFinished(listener: () => void): () => void {
    this.finishedListeners.add(listener);
    return () => this.finishedListeners.delete(listener);
  }

  /** Stops and jumps to t. */
  seek(t: number): void {
    this.update({ t: clamp01(t), direction: 0 });
  }

  /** Stops and moves by a small amount. */
  step(delta: number): void {
    this.seek(this.state.t + delta);
  }

  pause(): void {
    this.update({ direction: 0 });
  }

  /** Plays in a direction; pressing the same direction again pauses. At an end, restarts from the other end. */
  play(direction: -1 | 1): void {
    if (this.state.direction === direction) {
      this.pause();
      return;
    }
    let { t } = this.state;
    if (direction === 1 && t >= 1) t = 0;
    if (direction === -1 && t <= 0) t = 1;
    this.update({ t, direction });
  }

  advance(seconds: number): void {
    const { t, direction } = this.state;
    if (direction === 0) return;
    const next = t + (direction * Math.max(0, seconds)) / this.duration;
    if (direction === 1 && next >= 1) {
      this.update({ t: 1, direction: 0 });
      for (const listener of this.finishedListeners) listener();
    } else if (direction === -1 && next <= 0) {
      this.update({ t: 0, direction: 0 });
    } else {
      this.update({ t: next });
    }
  }
}
