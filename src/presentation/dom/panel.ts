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

import type { Message } from '../text/messages';
import { $, setHtml, setText } from './dom';

/** The side panel: title, description, live message and (optionally) an info list. */
export function createPanel() {
  const title = $('solidName');
  const description = $('solidText');
  const message = $('message');
  return {
    render(view: { title: string; description: string; message: Message; info?: [string, string][] }) {
      setText(title, view.title);
      setHtml(description, view.description);
      setHtml(message, view.message.html);
      const className = view.message.done ? 'message done' : 'message';
      if (message.className !== className) message.className = className;
      if (view.info) {
        setHtml($('info'), view.info.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join(''));
      }
    },
  };
}
