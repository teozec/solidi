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

export interface PickerItem<Id extends string> {
  readonly id: Id;
  readonly name: string;
  readonly color: string;
  readonly icon: string;
}

/** Row of big buttons to choose a solid. `setActive` only highlights; clicks call `onPick`. */
export function createPicker<Id extends string>(el: HTMLElement, items: readonly PickerItem<Id>[], onPick: (id: Id) => void) {
  el.innerHTML = '';
  const buttons = items.map((item) => {
    const b = document.createElement('button');
    b.className = 'pick';
    b.innerHTML = `<span class="pick-icon" style="background:${item.color}">${item.icon}</span>${item.name}`;
    b.onclick = () => onPick(item.id);
    el.appendChild(b);
    return [item.id, b] as const;
  });
  return {
    setActive(id: Id) {
      for (const [bid, b] of buttons) b.classList.toggle('active', bid === id);
    },
  };
}
