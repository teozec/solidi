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

import { describe, expect, it, vi } from 'vitest';
import { NetsPage } from './netsPage';
import { Playback } from './playback';
import { RevolutionPage } from './revolutionPage';

describe('Playback', () => {
  it('plays forward to the end, stops and reports it', () => {
    const p = new Playback(2);
    const finished = vi.fn();
    p.onFinished(finished);
    p.play(1);
    p.advance(1);
    expect(p.state).toEqual({ t: 0.5, direction: 1 });
    p.advance(5);
    expect(p.state).toEqual({ t: 1, direction: 0 });
    expect(finished).toHaveBeenCalledOnce();
  });

  it('plays backwards and stops at the start without reporting an end', () => {
    const p = new Playback(2);
    const finished = vi.fn();
    p.onFinished(finished);
    p.seek(0.5);
    p.play(-1);
    p.advance(5);
    expect(p.state).toEqual({ t: 0, direction: 0 });
    expect(finished).not.toHaveBeenCalled();
  });

  it('restarts from the other end and toggles pause on the same direction', () => {
    const p = new Playback(2);
    p.seek(1);
    p.play(1);
    expect(p.state).toEqual({ t: 0, direction: 1 });
    p.play(1);
    expect(p.state.direction).toBe(0);
  });

  it('ignores negative time steps', () => {
    const p = new Playback(2);
    p.play(1);
    p.advance(-0.01);
    expect(p.state).toEqual({ t: 0, direction: 1 });
  });
});

describe('RevolutionPage', () => {
  it('does not spin an invalid drawing', () => {
    const page = new RevolutionPage();
    const before = page.state.figure;
    page.startDrawing();
    page.updateDraft([[0, 0], [1, 1]]);
    page.spinDraft();
    expect(page.state.drawing).toBe(true);
    expect(page.state.figure).toBe(before);
  });

  it('spins a valid drawing from the start of the turn', () => {
    const page = new RevolutionPage();
    page.playback.seek(0.7);
    page.startDrawing();
    page.updateDraft([[0, 0], [1, 0], [1, 2], [0, 2]]);
    page.spinDraft();
    expect(page.state.drawing).toBe(false);
    expect(page.state.figure.vertices).toEqual([[0, 0], [1, 0], [1, 2], [0, 2]]);
    expect(page.playback.state.t).toBe(0);
  });

  it('keeps the drawing when drawing again', () => {
    const page = new RevolutionPage();
    page.startDrawing();
    page.updateDraft([[0, 0], [1, 0], [0, 1]]);
    page.selectSolid('cone');
    page.startDrawing();
    expect(page.state.draft.points).toHaveLength(3);
  });
});

describe('NetsPage', () => {
  it('closes the solid when another one is selected', () => {
    const page = new NetsPage();
    page.playback.seek(0.6);
    page.selectSolid('squarePyramid');
    expect(page.state.solid.id).toBe('squarePyramid');
    expect(page.playback.state.t).toBe(0);
    expect(page.faceAngles().every((a) => a === 0)).toBe(true);
  });
});
