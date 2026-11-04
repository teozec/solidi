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

// List of the saved solids, shown next to the drawing sheet.

export interface SavedListItem {
  /** Plain text typed by a child. */
  readonly name: string;
  readonly color: string;
  /** Trusted SVG markup. */
  readonly icon: string;
}

export interface SavedListView {
  readonly title: string;
  /** Trusted HTML, shown when the list is empty. */
  readonly empty: string;
  readonly items: readonly SavedListItem[];
  readonly loadLabel: (name: string) => string;
  readonly removeLabel: (name: string) => string;
}

export interface SavedListOptions {
  onLoad: (name: string) => void;
  onRemove: (name: string) => void;
}

export function createSavedList(el: HTMLElement, { onLoad, onRemove }: SavedListOptions) {
  return {
    render(view: SavedListView) {
      const title = document.createElement('h3');
      title.textContent = view.title;
      if (!view.items.length) {
        const empty = document.createElement('p');
        empty.className = 'saved-empty';
        empty.innerHTML = view.empty;
        el.replaceChildren(title, empty);
        return;
      }
      const list = document.createElement('ul');
      for (const item of view.items) {
        const load = document.createElement('button');
        load.className = 'saved-load';
        load.title = view.loadLabel(item.name);
        const icon = document.createElement('span');
        icon.className = 'pick-icon';
        icon.style.background = item.color;
        icon.innerHTML = item.icon;
        const name = document.createElement('span');
        name.className = 'saved-name';
        name.textContent = item.name;
        load.append(icon, name);
        load.onclick = () => onLoad(item.name);

        const remove = document.createElement('button');
        remove.className = 'saved-remove';
        remove.textContent = '✕';
        remove.title = view.removeLabel(item.name);
        remove.setAttribute('aria-label', view.removeLabel(item.name));
        remove.onclick = () => onRemove(item.name);

        const li = document.createElement('li');
        li.append(load, remove);
        list.appendChild(li);
      }
      el.replaceChildren(title, list);
    },
  };
}
