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

// Colors and icons. Icons are white strokes on a colored circle.
import type { NetSolidId } from '../domain/nets/catalog';
import type { RevolutionSolidId } from '../domain/revolution/catalog';

export interface PickerLook {
  readonly color: string;
  readonly icon: string;
}

export interface RevolutionLook extends PickerLook {
  /** Color of the plane figure (the solid uses `color`). */
  readonly figureColor: string;
}

const icon = (inner: string, strokeWidth = 3) =>
  `<svg viewBox="0 0 40 40" width="28" height="28" fill="none" stroke="#fff" stroke-width="${strokeWidth}" stroke-linejoin="round">${inner}</svg>`;

export const revolutionLooks: Record<RevolutionSolidId, RevolutionLook> = {
  cylinder: { color: '#4d96ff', figureColor: '#ffb703', icon: icon('<rect x="11" y="7" width="18" height="26"/>') },
  cone: { color: '#ff6b6b', figureColor: '#ffd93d', icon: icon('<path d="M12 33 L12 7 L30 33 Z"/>') },
  sphere: { color: '#6bcb77', figureColor: '#c77dff', icon: icon('<path d="M14 6 A14 14 0 0 1 14 34 Z"/>') },
  frustum: { color: '#c77dff', figureColor: '#6bcb77', icon: icon('<path d="M12 33 L12 9 L22 9 L30 33 Z"/>') },
};

export const customRevolutionLook: RevolutionLook = {
  color: '#ff9f43',
  figureColor: '#ffd93d',
  icon: icon('<path d="M9 31 L11 24 L26 9 L31 14 L16 29 Z M23 12 L28 17"/>'),
};

export const netLooks: Record<NetSolidId, PickerLook> = {
  cube: { color: '#ff6b6b', icon: icon('<path d="M8 14 L20 8 L32 14 L32 28 L20 34 L8 28 Z M8 14 L20 20 L32 14 M20 20 L20 34"/>', 2.6) },
  cuboid: { color: '#4d96ff', icon: icon('<path d="M5 16 L15 10 L35 14 L35 26 L25 32 L5 28 Z M5 16 L25 20 L35 14 M25 20 L25 32"/>', 2.6) },
  triangularPrism: { color: '#6bcb77', icon: icon('<path d="M8 30 L16 16 L24 30 Z M16 16 L28 8 L34 22 L24 30 M34 22 L8 30" />', 2.6) },
  squarePyramid: { color: '#ffb703', icon: icon('<path d="M20 6 L6 28 L22 34 L34 26 Z M20 6 L22 34"/>', 2.6) },
  cylinder: { color: '#c77dff', icon: icon('<ellipse cx="20" cy="10" rx="11" ry="4"/><path d="M9 10 L9 30 A11 4 0 0 0 31 30 L31 10"/>', 2.6) },
  cone: { color: '#2ec4b6', icon: icon('<path d="M20 6 L9 30 A11 4 0 0 0 31 30 Z"/>', 2.6) },
};

/** Colors of the faces of a net, one per surface in order of appearance. */
export const FACE_PALETTE = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff9f43', '#2ec4b6'];

export const INK = 0x1d2440;
export const AXIS_COLOR = '#e63946';
export const TRAIL_COLOR = 0xff8c00;
