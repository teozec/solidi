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

// Italian names and descriptions of the catalog solids.
import type { NetSolidId } from '../../domain/nets/catalog';
import type { RevolutionSolidId } from '../../domain/revolution/catalog';
import { feminine, masculine, type Noun } from './italian';

export interface RevolutionTexts {
  readonly solid: Noun;
  /** The plane figure that generates the solid. */
  readonly figure: Noun;
  readonly description: string;
}

export const revolutionTexts: Record<RevolutionSolidId, RevolutionTexts> = {
  cylinder: {
    solid: masculine('cilindro'),
    figure: masculine('rettangolo'),
    description:
      'Prendi un <b>rettangolo</b> e fallo girare attorno a uno dei suoi lati, come una porta che gira sui cardini.',
  },
  cone: {
    solid: masculine('cono'),
    figure: masculine('triangolo rettangolo'),
    description: 'Prendi un <b>triangolo rettangolo</b> e fallo girare attorno a uno dei lati che formano l’angolo retto.',
  },
  sphere: {
    solid: feminine('sfera'),
    figure: masculine('semicerchio'),
    description: 'Prendi un <b>semicerchio</b> (mezzo cerchio) e fallo girare attorno al suo lato dritto, il diametro.',
  },
  frustum: {
    solid: masculine('tronco di cono'),
    figure: masculine('trapezio rettangolo'),
    description: 'Prendi un <b>trapezio rettangolo</b> e fallo girare attorno al lato che forma gli angoli retti.',
  },
};

/** Texts for the figure drawn by the child. */
export const customRevolutionTexts = {
  pickerName: 'Disegna tu',
  solid: masculine('solido'),
  figure: feminine('figura'),
  figureLabel: 'disegnata da te',
  editingTitle: 'Disegna tu',
  editingDescription:
    'Disegna una figura piana alla destra dell’<b>asse</b> rosso. Poi la faremo girare per vedere che solido nasce!',
  description: 'Ecco la figura che hai disegnato. Secondo te, che solido verrà?',
  result: 'ecco il solido che hai inventato tu',
  holeHint: ' La figura non tocca l’asse: guarda il <b>buco</b> che si forma!',
} as const;

export interface NetTexts {
  readonly solid: Noun;
  readonly description: string;
  /** Shown when the net is completely open. */
  readonly netDescription: string;
}

export const netTexts: Record<NetSolidId, NetTexts> = {
  cube: {
    solid: masculine('cubo'),
    description: 'Il cubo ha <b>6 facce</b>, tutte <b>quadrati</b> uguali.',
    netDescription: 'Ecco lo sviluppo del cubo: <b>6 quadrati</b> a forma di croce!',
  },
  cuboid: {
    solid: masculine('parallelepipedo'),
    description:
      'Il parallelepipedo è come una scatola: ha <b>6 facce</b> che sono <b>rettangoli</b>, uguali a due a due.',
    netDescription: 'Ecco lo sviluppo: <b>6 rettangoli</b>, uguali a coppie.',
  },
  triangularPrism: {
    solid: masculine('prisma triangolare'),
    description: 'Il prisma triangolare ha <b>2 basi triangolari</b> e <b>3 facce laterali</b> rettangolari.',
    netDescription: 'Ecco lo sviluppo: <b>2 triangoli</b> e <b>3 rettangoli</b>.',
  },
  squarePyramid: {
    solid: feminine('piramide'),
    description:
      'La piramide a base quadrata ha <b>1 base quadrata</b> e <b>4 facce triangolari</b> che si incontrano in una punta.',
    netDescription: 'Ecco lo sviluppo: <b>1 quadrato</b> e <b>4 triangoli</b>, come una stella!',
  },
  cylinder: {
    solid: masculine('cilindro'),
    description: 'Il cilindro ha <b>2 basi</b> che sono <b>cerchi</b> e una <b>superficie laterale curva</b>.',
    netDescription: 'La superficie curva srotolata diventa un <b>rettangolo</b>! Più <b>2 cerchi</b> per le basi.',
  },
  cone: {
    solid: masculine('cono'),
    description:
      'Il cono ha <b>1 base</b> che è un <b>cerchio</b>, una <b>superficie laterale curva</b> e una punta, il <b>vertice</b>.',
    netDescription:
      'La superficie curva srotolata diventa una fetta di cerchio (un <b>settore circolare</b>), più <b>1 cerchio</b> per la base.',
  },
};
