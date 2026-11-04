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

import { describe, expect, it } from 'vitest';
import { agree, definite, feminine, indefinite, masculine, pronoun, yours } from './italian';
import { bornResult, characteristicsRows, figureFeedback, turnMessage, unfoldMessage } from './messages';
import { netTexts } from './solids';

describe('Italian grammar helpers', () => {
  it('chooses the definite article', () => {
    expect(definite(masculine('cubo'))).toBe('il cubo');
    expect(definite(feminine('piramide'))).toBe('la piramide');
    expect(definite(masculine('asse'))).toBe('l’asse');
    expect(definite(masculine('spigolo'))).toBe('lo spigolo');
  });

  it('chooses the indefinite article', () => {
    expect(indefinite(masculine('cilindro'))).toBe('un cilindro');
    expect(indefinite(feminine('sfera'))).toBe('una sfera');
    expect(indefinite(masculine('spigolo'))).toBe('uno spigolo');
  });

  it('agrees pronouns, adjectives and possessives with the gender', () => {
    expect(pronoun(feminine('piramide'))).toBe('la');
    expect(agree('piatto', feminine('piramide'))).toBe('piatta');
    expect(agree('piatto', masculine('cubo'))).toBe('piatto');
    expect(yours(feminine('figura'))).toBe('la tua figura');
  });
});

describe('messages', () => {
  it('speaks about the pyramid in the feminine', () => {
    const { solid, netDescription } = netTexts.squarePyramid;
    expect(unfoldMessage('closed', solid, netDescription).html).toContain('smontare la piramide e renderla piatta');
    expect(unfoldMessage('opening', solid, netDescription).html).toContain('La piramide si sta aprendo');
    expect(unfoldMessage('opening', solid, netDescription).html).toContain('richiuderla');
  });

  it('celebrates a complete turn', () => {
    const m = turnMessage({ kind: 'complete' }, 'il rettangolo', 'è nato un <b>cilindro</b>');
    expect(m).toEqual({ html: '🎉 Il rettangolo ha fatto un giro completo: è nato un <b>cilindro</b>!', done: true });
  });

  it('agrees "born" with the solid', () => {
    expect(bornResult(masculine('cilindro'))).toBe('è nato un <b>cilindro</b>');
    expect(bornResult(feminine('sfera'))).toBe('è nata una <b>sfera</b>');
  });

  it('explains figure errors', () => {
    expect(figureFeedback({ kind: 'tooFewPoints', missing: 3 }, false).html).toBe('Comincia toccando un puntino.');
    expect(figureFeedback({ kind: 'crossingSides', sides: new Set([0]) }, false).html).toContain('incrociano');
    expect(figureFeedback(null, true).html).toContain('con il buco');
  });

  it('describes curved solids in words', () => {
    const rows = characteristicsRows({ kind: 'curved', circularBases: 1, curvedLateralSurfaces: 1, curvedEdges: 1, vertices: 1 });
    expect(rows).toEqual([
      ['Base', '1 cerchio'],
      ['Superficie laterale', '1, curva'],
      ['Spigoli', '1, curvo'],
      ['Vertici', '1 (la punta)'],
    ]);
  });
});
