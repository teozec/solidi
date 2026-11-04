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

// Drawing sheet for the child's plane figure: a squared sheet with the axis on its left edge.
// It only draws and handles the pointer; the drawing itself lives in the application state.
import type { Point2 } from '../../domain/geometry/polygon';
import { editorLabels } from '../text/labels';
import { query } from './dom';
import type { Message } from '../text/messages';

/** Size of a grid square in 3D units. */
const STEP = 0.25;
const COLS = 8;
const ROWS = 12;
/** SVG pixels per grid square. */
const CELL = 40;
const LEFT = 56;
const TOP = 24;
const WIDTH = LEFT + COLS * CELL + 24;
const HEIGHT = TOP + ROWS * CELL + 24;

/** Grid point: integer coordinates in squares. */
type GridPoint = [number, number];

const sx = (gx: number) => LEFT + gx * CELL;
const sy = (gy: number) => TOP + (ROWS - gy) * CELL;
const same = (a: GridPoint, b: GridPoint) => a[0] === b[0] && a[1] === b[1];
const toGrid = ([x, y]: Point2): GridPoint => [Math.round(x / STEP), Math.round(y / STEP)];
const fromGrid = ([gx, gy]: GridPoint): Point2 => [gx * STEP, gy * STEP];

export interface FigureEditorView {
  points: readonly Point2[];
  /** Sides to highlight as wrong. */
  badSides: ReadonlySet<number>;
  feedback: Message;
  canSpin: boolean;
  /** Name typed for the figure. */
  name: string;
}

export interface FigureEditorOptions {
  /** The drawing changed (points in 3D units). */
  onChange: (points: Point2[]) => void;
  onSpin: () => void;
  onRename: (name: string) => void;
  onSave: () => void;
}

const staticSheet = (() => {
  let s = `<rect x="0" y="0" width="${LEFT}" height="${HEIGHT}" fill="#eceff7"/>`;
  for (let gx = 0; gx <= COLS; gx++)
    s += `<line x1="${sx(gx)}" y1="${sy(0)}" x2="${sx(gx)}" y2="${sy(ROWS)}" stroke="#d7def0" stroke-width="1.5"/>`;
  for (let gy = 0; gy <= ROWS; gy++)
    s += `<line x1="${sx(0)}" y1="${sy(gy)}" x2="${sx(COLS)}" y2="${sy(gy)}" stroke="#d7def0" stroke-width="1.5"/>`;
  for (let gx = 0; gx <= COLS; gx++)
    for (let gy = 0; gy <= ROWS; gy++) s += `<circle cx="${sx(gx)}" cy="${sy(gy)}" r="4" fill="#a9b3d1"/>`;
  s += `<line x1="${sx(0)}" y1="${HEIGHT - 6}" x2="${sx(0)}" y2="14" stroke="#e63946" stroke-width="5" stroke-dasharray="14 8"/>
    <path d="M${sx(0) - 10} 18 L${sx(0)} 2 L${sx(0) + 10} 18 Z" fill="#e63946"/>
    <text x="${sx(0) - 10}" y="${sy(ROWS / 2)}" fill="#e63946" font-size="20" font-weight="600" text-anchor="middle"
      transform="rotate(-90 ${sx(0) - 14} ${sy(ROWS / 2)})">${editorLabels.axis}</text>`;
  return `<g>${s}</g>`;
})();

export function createFigureEditor(el: HTMLElement, { onChange, onSpin, onRename, onSave }: FigureEditorOptions) {
  el.innerHTML = `
    <p class="editor-head">${editorLabels.instructions}</p>
    <svg class="editor-svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" preserveAspectRatio="xMidYMid meet"></svg>
    <p class="editor-msg"></p>
    <form class="editor-name">
      <input type="text" maxlength="40" autocomplete="off" aria-label="${editorLabels.name}" placeholder="${editorLabels.namePlaceholder}" />
      <button class="ed-btn" type="submit">${editorLabels.save}</button>
    </form>
    <div class="editor-actions">
      <button class="ed-btn" data-act="undo">${editorLabels.undo}</button>
      <button class="ed-btn" data-act="clear">${editorLabels.clear}</button>
      <button class="ed-btn ed-main" data-act="spin">${editorLabels.spin}</button>
    </div>`;
  const svg = query<SVGSVGElement>(el, 'svg');
  const messageEl = query<HTMLElement>(el, '.editor-msg');
  const nameForm = query<HTMLFormElement>(el, '.editor-name');
  const nameInput = query<HTMLInputElement>(nameForm, 'input');
  const saveButton = query<HTMLButtonElement>(nameForm, 'button');
  const buttons = Object.fromEntries(
    [...el.querySelectorAll<HTMLButtonElement>('[data-act]')].map((b) => [b.dataset.act, b]),
  ) as Record<'undo' | 'clear' | 'spin', HTMLButtonElement>;

  let current: FigureEditorView = { points: [], badSides: new Set(), feedback: { html: '', done: false }, canSpin: false, name: '' };
  /** Index of the vertex being dragged, -1 if none. */
  let dragging = -1;

  const grid = () => current.points.map(toGrid);
  const change = (points: GridPoint[]) => onChange(points.map(fromGrid));

  function draw() {
    const pts = grid();
    const n = pts.length;
    const ok = current.canSpin;
    let s = staticSheet;
    if (n >= 3) {
      s += `<polygon points="${pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' ')}" fill="#ffd93d" fill-opacity="${ok ? 0.8 : 0.35}"/>`;
    }
    pts.forEach((p, i) => {
      if (i === n - 1 && n < 3) return;
      const q = pts[(i + 1) % n];
      const closing = i === n - 1;
      s += `<line x1="${sx(p[0])}" y1="${sy(p[1])}" x2="${sx(q[0])}" y2="${sy(q[1])}"
        stroke="${current.badSides.has(i) ? '#e63946' : '#1d2440'}" stroke-width="5" stroke-linecap="round"
        ${closing ? 'stroke-dasharray="10 9"' : ''}/>`;
    });
    pts.forEach(([x, y], i) => {
      s += `<circle cx="${sx(x)}" cy="${sy(y)}" r="${i === dragging ? 14 : 11}" fill="${i === 0 ? '#ff8c00' : '#fff'}"
        stroke="#1d2440" stroke-width="4"/>`;
    });
    svg.innerHTML = s;
    messageEl.innerHTML = current.feedback.html;
    messageEl.classList.toggle('ok', current.feedback.done);
    buttons.spin.disabled = !ok;
    saveButton.disabled = !ok;
    // Only when it differs, so typing does not move the caret.
    if (nameInput.value !== current.name) nameInput.value = current.name;
    buttons.undo.disabled = n === 0;
    buttons.clear.disabled = n === 0;
  }

  function gridPoint(e: PointerEvent): GridPoint {
    const ctm = svg.getScreenCTM();
    if (!ctm) return [0, 0];
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const gx = Math.round((p.x - LEFT) / CELL);
    const gy = Math.round(ROWS - (p.y - TOP) / CELL);
    return [Math.min(COLS, Math.max(0, gx)), Math.min(ROWS, Math.max(0, gy))];
  }

  svg.addEventListener('pointerdown', (e) => {
    const g = gridPoint(e);
    const pts = grid();
    const hit = pts.findIndex((p) => same(p, g));
    if (hit >= 0) {
      dragging = hit;
      draw();
    } else {
      dragging = pts.length;
      change([...pts, g]);
    }
    try {
      svg.setPointerCapture(e.pointerId);
    } catch {
      // Some devices refuse capture; dragging still works inside the sheet.
    }
  });
  svg.addEventListener('pointermove', (e) => {
    if (dragging < 0) return;
    const g = gridPoint(e);
    const pts = grid();
    if (same(pts[dragging], g) || pts.some((p, i) => i !== dragging && same(p, g))) return;
    pts[dragging] = g;
    change(pts);
  });
  const stopDragging = () => {
    dragging = -1;
    draw();
  };
  svg.addEventListener('pointerup', stopDragging);
  svg.addEventListener('pointercancel', stopDragging);

  buttons.undo.onclick = () => change(grid().slice(0, -1));
  buttons.clear.onclick = () => change([]);
  buttons.spin.onclick = () => onSpin();
  nameInput.addEventListener('input', () => onRename(nameInput.value));
  nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    onSave();
  });

  return {
    render(view: FigureEditorView) {
      current = view;
      draw();
    },
  };
}
