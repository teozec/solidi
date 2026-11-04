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

// Italian texts about the solids saved with a name.
import type { SaveError } from '../../application/revolutionPage';
import type { Result } from '../../domain/result';
import { escapeHtml } from './html';
import type { Message } from './messages';

/** The child's own name, as shown inside a sentence: «Razzo». */
const quoted = (name: string) => `«${name}»`;

export const savedSolidTexts = {
  /** Description of a named solid turning in the 3D view. */
  description: (name: string) =>
    `Ecco la figura di <b>${escapeHtml(quoted(name))}</b>. Secondo te, che solido verrà?`,
  listTitle: (count: number) => (count ? `Solidi salvati (${count})` : 'Solidi salvati'),
  listEmpty: 'Qui compariranno i solidi che salvi. Dai un nome alla tua figura e premi <b>Salva</b>.',
  loadLabel: (name: string) => `Apri ${quoted(name)} sul foglio`,
  removeLabel: (name: string) => `Cancella ${quoted(name)}`,
  /** For the browser's confirmation dialog: plain text. */
  removeQuestion: (name: string) => `Vuoi cancellare ${quoted(name)}? Non si potrà più recuperare.`,
  replaceQuestion: (name: string) => `C'è già un solido che si chiama ${quoted(name)}. Vuoi sostituirlo con questo?`,
} as const;

/** What happened after pressing "Salva". `null` = nothing to say. */
export function saveFeedback(result: Result<string, SaveError> | 'replaceDeclined'): Message | null {
  if (result === 'replaceDeclined') return { html: 'Va bene! Scegli un altro nome.', done: false };
  if (result.ok) {
    return { html: `💾 Salvato! Trovi <b>${escapeHtml(quoted(result.value))}</b> nella lista qui sotto.`, done: true };
  }
  const error = result.error;
  switch (error.kind) {
    case 'emptyName':
      return { html: 'Scrivi un nome per il tuo solido, poi premi <b>Salva</b>.', done: false };
    case 'nameTooLong':
      return { html: `Il nome è troppo lungo: usa al massimo <b>${error.max} lettere</b>.`, done: false };
    case 'full':
      return { html: `Ci sono già <b>${error.max} solidi</b> salvati: cancellane uno con la ✕ per fare spazio.`, done: false };
    case 'nothingToSave':
      return { html: 'Prima finisci la figura: si può salvare quando è giusta.', done: false };
    case 'storageFailed':
      return { html: 'Non riesco a salvare su questo computer: forse il browser non lo permette.', done: false };
    case 'nameTaken':
      return null;
  }
}
