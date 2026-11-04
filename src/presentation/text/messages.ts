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

// Italian sentences built from domain phases, errors and characteristics.
import type { Characteristics } from '../../domain/nets/characteristics';
import type { UnfoldPhase } from '../../domain/nets/unfolding';
import type { FigureError } from '../../domain/revolution/planeFigure';
import type { TurnPhase } from '../../domain/revolution/turn';
import { agree, bold, capitalize, count, definite, indefinite, pronoun, type Noun } from './italian';

export interface Message {
  readonly html: string;
  /** Celebration style (green), used when an animation is complete. */
  readonly done: boolean;
}

const QUARTERS = ['l’inizio di un giro', 'un quarto di giro', 'mezzo giro', 'tre quarti di giro', 'quasi un giro intero'];

/**
 * Message about a figure turning around the axis.
 * `figure` already has its article ("il rettangolo", "la tua figura");
 * `result` is what appears at the end ("è nato un <b>cilindro</b>").
 */
export function turnMessage(phase: TurnPhase, figure: string, result: string): Message {
  switch (phase.kind) {
    case 'start':
      return { html: `Premi <b>Avanti ▶</b> per far girare ${figure} attorno all’asse.`, done: false };
    case 'turning':
      return { html: `${capitalize(figure)} gira… ha fatto circa <b>${QUARTERS[phase.quarters]}</b>.`, done: false };
    case 'complete':
      return { html: `🎉 ${capitalize(figure)} ha fatto un giro completo: ${result}!`, done: true };
  }
}

/** "è nato un <b>cilindro</b>", "è nata una <b>sfera</b>". */
export const bornResult = (solid: Noun): string => `è ${agree('nato', solid)} ${indefinite(solid, bold)}`;

export const drawingMessage: Message = {
  html: 'Disegna una figura sul foglio a quadretti, poi premi <b>Fai girare!</b>',
  done: false,
};

/** Feedback under the drawing sheet. `error` is null when the figure is valid. */
export function figureFeedback(error: FigureError | null, generatesHole: boolean): Message {
  if (!error) {
    const hole = generatesHole ? '<br>La figura non tocca l’asse: verrà un solido <b>con il buco</b>!' : '';
    return { html: `✅ Bella figura! Premi <b>Fai girare!</b>${hole}`, done: true };
  }
  switch (error.kind) {
    case 'tooFewPoints':
      return {
        html:
          error.missing === 3
            ? 'Comincia toccando un puntino.'
            : `Metti almeno <b>3 punti</b> (ne mancano ${error.missing}).`,
        done: false,
      };
    case 'collinear':
      return { html: 'I punti sono tutti in fila: allargali per fare una figura.', done: false };
    case 'crossingSides':
      return { html: 'Alcuni lati si <b>incrociano</b> (sono in rosso): sposta i punti!', done: false };
    case 'leftOfAxis':
      return { html: 'Disegna alla <b>destra</b> dell’asse!', done: false };
  }
}

/** Message about a solid opening into its net. */
export function unfoldMessage(phase: UnfoldPhase, solid: Noun, netDescription: string): Message {
  const the = definite(solid);
  switch (phase) {
    case 'closed':
      return {
        html: `Premi <b>Avanti ▶</b> per smontare ${the} e render${pronoun(solid)} ${agree('piatto', solid)}.`,
        done: false,
      };
    case 'opening':
      return {
        html: `${capitalize(the)} si sta aprendo… Puoi tornare <b>Indietro ◀</b> per richiuder${pronoun(solid)}!`,
        done: false,
      };
    case 'open':
      return { html: `🎉 ${netDescription}`, done: true };
  }
}

/** Rows of the info box ("Facce: 6", "Basi: 2 cerchi"…). */
export function characteristicsRows(c: Characteristics): [string, string][] {
  if (c.kind === 'polyhedron') {
    return [
      ['Facce', String(c.faces)],
      ['Spigoli', String(c.edges)],
      ['Vertici', String(c.vertices)],
    ];
  }
  return [
    [c.circularBases === 1 ? 'Base' : 'Basi', count(c.circularBases, 'cerchio', 'cerchi')],
    ['Superficie laterale', `${c.curvedLateralSurfaces}, curva`],
    ['Spigoli', `${c.curvedEdges}, ${c.curvedEdges === 1 ? 'curvo' : 'curvi'}`],
    ['Vertici', c.vertices === 1 ? '1 (la punta)' : String(c.vertices)],
  ];
}
