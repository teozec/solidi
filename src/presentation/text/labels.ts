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

// Italian labels of the controls.

export const playbackLabels = {
  start: { icon: '⏮', label: 'Inizio', title: 'Torna all’inizio' },
  back: { icon: '◀', label: 'Indietro', title: 'Riproduci all’indietro' },
  pause: { icon: '⏸', label: 'Ferma', title: 'Ferma' },
  fwd: { icon: '▶', label: 'Avanti', title: 'Riproduci in avanti' },
  end: { icon: '⏭', label: 'Fine', title: 'Vai alla fine' },
  slider: 'Posizione dell’animazione',
} as const;

export const editorLabels = {
  instructions: 'Tocca i puntini per mettere i <b>vertici</b> della figura. Trascina un vertice per spostarlo.',
  axis: 'asse',
  undo: '↩ Togli l’ultimo',
  clear: '🗑 Ricomincia',
  spin: '🔄 Fai girare!',
  name: 'Nome del solido',
  namePlaceholder: 'es. Razzo',
  save: '💾 Salva',
} as const;
