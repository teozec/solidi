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

// Entry point of the "solids of revolution" page: wires application state to the views.
import { RevolutionPage, type RevolutionState } from '../application/revolutionPage';
import type { RevolutionSolidId } from '../domain/revolution/catalog';
import type { PlaneFigure } from '../domain/revolution/planeFigure';
import type { SolidCollection } from '../domain/revolution/solidCollection';
import { turnPhase } from '../domain/revolution/turn';
import { browserSolidStorage } from '../infrastructure/browserSolidStorage';
import { customRevolutionLook, revolutionLooks, savedSolidLook } from '../presentation/appearance';
import { $ } from '../presentation/dom/dom';
import { createFigureEditor } from '../presentation/dom/figureEditor';
import { createPanel } from '../presentation/dom/panel';
import { createPicker } from '../presentation/dom/picker';
import { createPlaybackControls } from '../presentation/dom/playbackControls';
import { createSavedList } from '../presentation/dom/savedList';
import { createScene } from '../presentation/three/scene';
import { createRevolutionView, REVOLUTION_HOME_VIEW } from '../presentation/three/revolutionView';
import { capitalize, definite, yours } from '../presentation/text/italian';
import { bornResult, drawingMessage, figureFeedback, turnMessage, type Message } from '../presentation/text/messages';
import { saveFeedback, savedSolidTexts as saved } from '../presentation/text/savedSolids';
import { customRevolutionTexts as custom, revolutionTexts } from '../presentation/text/solids';

const CUSTOM = 'custom';

const page = new RevolutionPage(browserSolidStorage());
const handle = createScene($('viewport'), { cameraPos: REVOLUTION_HOME_VIEW.pos, target: REVOLUTION_HOME_VIEW.target });
const view = createRevolutionView(handle);
const panel = createPanel();
createPlaybackControls($('timeline'), page.playback);

const picker = createPicker<RevolutionSolidId | typeof CUSTOM>(
  $('picker'),
  [
    ...page.catalog.map(({ id }) => ({ id, name: capitalize(revolutionTexts[id].solid.word), ...revolutionLooks[id] })),
    { id: CUSTOM, name: custom.pickerName, ...customRevolutionLook },
  ],
  (id) => (id === CUSTOM ? page.startDrawing() : page.selectSolid(id)),
);

const editor = createFigureEditor($('editor'), {
  onChange: (points) => page.updateDraft(points),
  onSpin: () => page.spinDraft(),
  onRename: (name) => page.renameDraft(name),
  onSave: save,
});

const savedList = createSavedList($('saved'), {
  onLoad: (name) => page.loadSaved(name),
  onRemove: (name) => {
    if (window.confirm(saved.removeQuestion(name))) page.deleteSaved(name);
  },
});

/** Outcome of the last "Salva", shown while the drawing it refers to stays the same. */
let saveMessage: { message: Message; draft: RevolutionState['draft'] } | null = null;

function save() {
  let result = page.saveDraft();
  if (!result.ok && result.error.kind === 'nameTaken') {
    if (window.confirm(saved.replaceQuestion(result.error.name))) result = page.saveDraft({ replace: true });
  }
  const declined = !result.ok && result.error.kind === 'nameTaken';
  const message = saveFeedback(declined ? 'replaceDeclined' : result);
  saveMessage = message && { message, draft: page.state.draft };
  render();
}

/** Words and colors for what is currently turning. */
function describe(s: RevolutionState) {
  if (s.selection.kind === 'custom') {
    const name = s.figureName;
    const hole = s.figure.generatesSolidWithHole() ? custom.holeHint : '';
    return {
      title: name ?? capitalize(yours(custom.solid)),
      description: (name ? saved.description(name) : custom.description) + hole,
      figurePhrase: yours(custom.figure),
      figureLabel: custom.figureLabel,
      result: custom.result,
      look: name ? savedSolidLook(name, s.figure) : customRevolutionLook,
    };
  }
  const texts = revolutionTexts[s.selection.id];
  return {
    title: capitalize(texts.solid.word),
    description: texts.description,
    figurePhrase: definite(texts.figure),
    figureLabel: texts.figure.word,
    result: bornResult(texts.solid),
    look: revolutionLooks[s.selection.id],
  };
}

let shownFigure: PlaneFigure | null = null;
let shownLook: string | null = null;
let shownDraft: RevolutionState['draft'] | null = null;
let shownCollection: SolidCollection | null = null;

function renderSavedList(collection: SolidCollection) {
  savedList.render({
    title: saved.listTitle(collection.size),
    empty: saved.listEmpty,
    items: collection.solids.map(({ name, figure }) => ({ name, ...savedSolidLook(name, figure) })),
    loadLabel: saved.loadLabel,
    removeLabel: saved.removeLabel,
  });
}

function render() {
  const s = page.state;
  const t = page.playback.state.t;
  const d = describe(s);

  picker.setActive(s.selection.kind === 'custom' ? CUSTOM : s.selection.id);

  // A name gives the solid its own color without changing the figure.
  if (s.figure !== shownFigure || d.look.color !== shownLook) {
    view.show(s.figure, { solid: d.look.color, figure: d.look.figureColor });
    shownFigure = s.figure;
    shownLook = d.look.color;
    $('figName').textContent = d.figureLabel;
    $('shapeDot').style.background = d.look.figureColor;
    $('surfDot').style.background = d.look.color;
  }
  view.render(t, s.filled);

  document.body.classList.toggle('editing', s.drawing);
  $('editor').hidden = !s.drawing;
  $('saved').hidden = !s.drawing;
  $('editDrawing').hidden = s.drawing || s.selection.kind !== 'custom';

  if (s.drawing) {
    if (s.collection !== shownCollection) {
      renderSavedList(s.collection);
      shownCollection = s.collection;
    }
    const message = saveMessage?.draft === s.draft ? saveMessage.message : drawingMessage;
    panel.render({ title: custom.editingTitle, description: custom.editingDescription, message });
    if (s.draft !== shownDraft) {
      const check = s.draft.check;
      editor.render({
        points: s.draft.points,
        badSides: !check.ok && check.error.kind === 'crossingSides' ? check.error.sides : new Set(),
        feedback: figureFeedback(check.ok ? null : check.error, check.ok && check.value.generatesSolidWithHole()),
        canSpin: check.ok,
        name: s.draft.name,
      });
      shownDraft = s.draft;
    }
  } else {
    const message = turnMessage(turnPhase(t), d.figurePhrase, d.result);
    panel.render({ title: d.title, description: d.description, message });
  }
}

page.subscribe(render);
page.playback.subscribe(render);

$('editDrawing').onclick = () => page.startDrawing();
$<HTMLInputElement>('fillToggle').addEventListener('change', (e) => page.setFilled((e.target as HTMLInputElement).checked));
$('resetView').onclick = () => handle.flyTo(REVOLUTION_HOME_VIEW.pos, REVOLUTION_HOME_VIEW.target);

render();
