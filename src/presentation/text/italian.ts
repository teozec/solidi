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

// Minimal Italian grammar for the sentences shown to children.

export type Gender = 'masculine' | 'feminine';

export interface Noun {
  /** Singular form, possibly with modifiers ("triangolo rettangolo"). */
  readonly word: string;
  readonly gender: Gender;
}

export const masculine = (word: string): Noun => ({ word, gender: 'masculine' });
export const feminine = (word: string): Noun => ({ word, gender: 'feminine' });

const startsWithVowel = (word: string) => /^[aeiouàèéìòù]/i.test(word);
/** Masculine words taking "lo"/"uno": s + consonant, z, gn, ps, x, y. */
const takesLo = (word: string) => /^(s[^aeiou]|z|gn|ps|x|y)/i.test(word);

/** Formats the noun alone (e.g. in bold), leaving the article as plain text. */
type Format = (word: string) => string;
const plain: Format = (w) => w;

/** Definite article + noun: "il cubo", "la piramide", "l'asse", "lo spigolo". */
export function definite(n: Noun, format: Format = plain): string {
  const w = format(n.word);
  if (startsWithVowel(n.word)) return `l’${w}`;
  if (n.gender === 'feminine') return `la ${w}`;
  return takesLo(n.word) ? `lo ${w}` : `il ${w}`;
}

/** Indefinite article + noun: "un cilindro", "una sfera", "un’ellisse", "uno spigolo". */
export function indefinite(n: Noun, format: Format = plain): string {
  const w = format(n.word);
  if (n.gender === 'feminine') return startsWithVowel(n.word) ? `un’${w}` : `una ${w}`;
  return takesLo(n.word) ? `uno ${w}` : `un ${w}`;
}

export const bold: Format = (w) => `<b>${w}</b>`;

/** Possessive with article: "il tuo solido", "la tua figura". */
export const yours = (n: Noun): string => (n.gender === 'feminine' ? `la tua ${n.word}` : `il tuo ${n.word}`);

/** Direct object pronoun, to attach to a verb: "richiuder" + "lo" / "la". */
export const pronoun = (n: Noun): string => (n.gender === 'feminine' ? 'la' : 'lo');

/** Agrees a masculine singular adjective ending in -o with the noun: "piatto" → "piatta". */
export const agree = (adjective: string, n: Noun): string =>
  n.gender === 'feminine' && adjective.endsWith('o') ? `${adjective.slice(0, -1)}a` : adjective;

/** "1 cerchio", "2 cerchi". */
export const count = (n: number, singular: string, plural: string): string => `${n} ${n === 1 ? singular : plural}`;

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
