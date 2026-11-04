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

// Entry point of the "nets" page: wires application state to the views.
import { NetsPage } from '../application/netsPage';
import { unfoldPhase, type UnfoldingPlan } from '../domain/nets/unfolding';
import { netLooks } from '../presentation/appearance';
import { $ } from '../presentation/dom/dom';
import { createPanel } from '../presentation/dom/panel';
import { createPicker } from '../presentation/dom/picker';
import { createPlaybackControls } from '../presentation/dom/playbackControls';
import { createNetView } from '../presentation/three/netView';
import { createScene, smoothstep } from '../presentation/three/scene';
import { capitalize } from '../presentation/text/italian';
import { characteristicsRows, unfoldMessage } from '../presentation/text/messages';
import { netTexts } from '../presentation/text/solids';

const page = new NetsPage();
const handle = createScene($('viewport'), { cameraPos: [5, 4.5, 7], target: [0, 1, 0] });
const view = createNetView(handle);
const panel = createPanel();
createPlaybackControls($('timeline'), page.playback);

const picker = createPicker(
  $('picker'),
  page.catalog.map(({ id }) => ({ id, name: capitalize(netTexts[id].solid.word), ...netLooks[id] })),
  (id) => page.selectSolid(id),
);

let shownPlan: UnfoldingPlan | null = null;

function render() {
  const { solid, plan } = page.state;
  const texts = netTexts[solid.id];
  picker.setActive(solid.id);

  if (plan !== shownPlan) {
    view.show(plan);
    view.frame3D();
    shownPlan = plan;
  }
  view.render(page.faceAngles(smoothstep));

  panel.render({
    title: capitalize(texts.solid.word),
    description: texts.description,
    message: unfoldMessage(unfoldPhase(page.playback.state.t), texts.solid, texts.netDescription),
    info: characteristicsRows(solid.characteristics),
  });
}

page.subscribe(render);
page.playback.subscribe(render);
// At the end of Play, look at the flat net from above.
page.playback.onFinished(() => view.frameTop());

$<HTMLInputElement>('stepToggle').addEventListener('change', (e) => page.setOneAtATime((e.target as HTMLInputElement).checked));
$('resetView').onclick = () => view.frame3D();
$('topView').onclick = () => view.frameTop();

render();
