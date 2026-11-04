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

import type { Playback } from '../../application/playback';
import { playbackLabels } from '../text/labels';
import { query } from './dom';

type Action = 'start' | 'back' | 'pause' | 'fwd' | 'end';

/**
 * Buttons (start, back, pause, forward, end), slider and keyboard for a Playback.
 * Also drives time: while playing, advances the playback on every animation frame.
 * Keyboard: arrows = small step, space = forward/pause.
 */
export function createPlaybackControls(el: HTMLElement, playback: Playback): void {
  const actions: Action[] = ['start', 'back', 'pause', 'fwd', 'end'];
  el.innerHTML = `
    ${actions
      .map((a) => {
        const { icon, label, title } = playbackLabels[a];
        return `<button class="tl-btn${a === 'fwd' ? ' tl-main' : ''}" data-act="${a}" title="${title}">${icon}<span class="tl-label">${label}</span></button>`;
      })
      .join('\n')}
    <input class="tl-slider" type="range" min="0" max="1000" value="0" aria-label="${playbackLabels.slider}" />
  `;
  const slider = query<HTMLInputElement>(el, '.tl-slider');
  const buttons = Object.fromEntries(
    [...el.querySelectorAll<HTMLButtonElement>('[data-act]')].map((b) => [b.dataset.act, b]),
  ) as Record<Action, HTMLButtonElement>;

  buttons.start.onclick = () => playback.seek(0);
  buttons.end.onclick = () => playback.seek(1);
  buttons.pause.onclick = () => playback.pause();
  buttons.fwd.onclick = () => playback.play(1);
  buttons.back.onclick = () => playback.play(-1);
  slider.oninput = () => playback.seek(Number(slider.value) / 1000);

  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement && e.target.type !== 'range') return;
    const actions: Record<string, () => void> = {
      ArrowRight: () => playback.step(0.05),
      ArrowLeft: () => playback.step(-0.05),
      ' ': () => playback.play(1),
    };
    const action = actions[e.key];
    if (!action) return;
    action();
    e.preventDefault();
  });

  // Animation clock: runs only while playing.
  let running = false;
  let last = 0;
  const tick = (now: number) => {
    if (playback.state.direction === 0) {
      running = false;
      return;
    }
    // rAF timestamps can be slightly older than performance.now(): never step backwards in time.
    playback.advance(Math.max(0, now - last) / 1000);
    last = Math.max(last, now);
    requestAnimationFrame(tick);
  };

  const render = () => {
    const { t, direction } = playback.state;
    slider.value = String(Math.round(t * 1000));
    slider.style.setProperty('--p', `${t * 100}%`);
    buttons.fwd.classList.toggle('active', direction === 1);
    buttons.back.classList.toggle('active', direction === -1);
    if (direction !== 0 && !running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
  };
  playback.subscribe(render);
  render();
}
