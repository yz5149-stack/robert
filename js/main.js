import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createModel, actions, find, KINDS, FURNITURE_TYPES, segmentLength, segmentSlope,
  intersectionElevation, connectedSegments, garageUpperLevelElevation, dockOf, vaultOf,
} from './model.js';
import { createView } from './view.js';

let model = createModel();
let selection = null;
let labelsOn = true;

const view = createView(document.getElementById('viewport'));
const controls = new OrbitControls(view.camera, view.renderer.domElement);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2.05;
controls.minDistance = 20;
controls.maxDistance = 900;

const CAMERAS = {
  perspective: { pos: [120, 150, 330], target: [-50, 0, 130] },
  top: { pos: [-40, 560, 136], target: [-40, 0, 135] },
};
function setCamera(name) {
  const c = CAMERAS[name];
  view.camera.position.set(...c.pos);
  controls.target.set(...c.target);
  controls.update();
}
setCamera('perspective');

const toolbarContext = document.getElementById('context-tools');
const info = document.getElementById('info');
const toast = document.getElementById('toast');

// ---------- Actions shown for each selected entity kind ----------

const pretty = (s) => String(s).replace(/_/g, ' ');

const CONTEXT = {
  StreetSegment: (e) => [
    ['Add building', () => actions.addBuilding(model, e)],
    ['Add garage', () => actions.addGarage(model, e)],
    ['Add subway entrance', () => actions.addSubwayEntrance(model, e)],
    ['Add drain', () => actions.addDrain(model, e)],
    { furniture: true, run: (type) => actions.addFurniture(model, e, type) },
    [`Surface: ${e.surface} ↻`, () => actions.changeSurface(model, e)],
    ['Elevation ▲', () => actions.changeElevation(model, e, 0.2)],
    ['Elevation ▼', () => actions.changeElevation(model, e, -0.2)],
  ],
  Intersection: (e) => [
    [e.hasTrafficSignal ? 'Remove signal' : 'Add signal', () => actions.toggleSignal(model, e)],
    [e.hasCurbRamp ? 'Remove curb ramps' : 'Add curb ramps', () => actions.toggleCurbRamp(model, e)],
  ],
  Building: (e) => [
    ['Floor ▲', () => actions.changeFloors(model, e, 1)],
    ['Floor ▼', () => actions.changeFloors(model, e, -1)],
    [`Use: ${e.use} ↻`, () => actions.changeUse(model, e)],
    [e.hasAwning ? 'Remove awning' : 'Add awning', () => actions.toggleAwning(model, e)],
    [e.hasBasement ? 'Remove basement' : 'Add basement', () => actions.toggleBasement(model, e)],
    ['Add loading dock', () => actions.addLoadingDock(model, e)],
    ['Add vault lights', () => actions.addVault(model, e)],
    ['Remove', () => actions.remove(model, 'Building', e), 'danger'],
  ],
  LoadingDock: (e) => [
    [e.hasRamp ? 'Replace ramp with steps' : 'Add ramp', () => actions.toggleRamp(model, e)],
    ['Height ▲', () => actions.changeDockHeight(model, e, 0.1)],
    ['Height ▼', () => actions.changeDockHeight(model, e, -0.1)],
    ['Remove', () => actions.remove(model, 'LoadingDock', e), 'danger'],
  ],
  SidewalkVault: (e) => [
    [`Condition: ${e.condition} ↻`, () => actions.changeCondition(model, e)],
    ['Remove', () => actions.remove(model, 'SidewalkVault', e), 'danger'],
  ],
  SubwayEntrance: (e) => [
    ['Remove', () => actions.remove(model, 'SubwayEntrance', e), 'danger'],
  ],
  DrainageInlet: (e) => [
    [e.hasCover ? 'Remove cover' : 'Replace cover', () => actions.toggleCover(model, e)],
    [`Type: ${pretty(e.type)} ↻`, () => actions.toggleDrainType(model, e)],
    ['Remove', () => actions.remove(model, 'DrainageInlet', e), 'danger'],
  ],
  ParkingGarage: (e) => [
    ['Level ▲', () => actions.changeLevels(model, e, 1)],
    ['Level ▼', () => actions.changeLevels(model, e, -1)],
    ['Remove', () => actions.remove(model, 'ParkingGarage', e), 'danger'],
  ],
  StreetFurniture: (e) => [
    [`Type: ${pretty(e.type)} ↻`, () => actions.changeFurnitureType(model, e)],
    ['Remove', () => actions.remove(model, 'StreetFurniture', e), 'danger'],
  ],
};

function button(text, onClick, cls = '') {
  const b = document.createElement('button');
  b.textContent = text;
  if (cls) b.className = cls;
  b.addEventListener('click', onClick);
  return b;
}

function runAction(fn) {
  const result = fn();
  showToast(result.msg, result.ok);
  if (!result.ok) return;
  // Keep the current selection so several things can be added in a row.
  if (selection && !find(model, selection.kind, selection.id)) selection = null;
  refresh();
}

function renderToolbar() {
  toolbarContext.replaceChildren();
  const entity = selection && find(model, selection.kind, selection.id);
  if (!entity) {
    const hint = document.createElement('span');
    hint.className = 'hint';
    hint.textContent = 'Click a street, building or object to edit it';
    toolbarContext.append(hint);
    return;
  }
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = `${selection.kind} ${entity.id}`;
  toolbarContext.append(tag);
  for (const item of CONTEXT[selection.kind](entity)) {
    if (item.furniture) {
      const wrap = document.createElement('span');
      wrap.className = 'combo';
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Furniture type');
      FURNITURE_TYPES.forEach((t) => select.append(new Option(pretty(t), t)));
      wrap.append(select, button('Add furniture', () => runAction(() => item.run(select.value))));
      toolbarContext.append(wrap);
    } else {
      const [text, fn, cls] = item;
      toolbarContext.append(button(text, () => runAction(fn), cls));
    }
  }
}

// ---------- Info panel ----------

function link(kind, id, text = id) {
  return `<a href="#" data-kind="${kind}" data-id="${id}">${text}</a>`;
}

function row(k, v) {
  return `<tr><th>${k}</th><td>${v}</td></tr>`;
}

function describe(kind, e) {
  const rows = [];
  const rel = [];
  const fmt = (n, d = 1) => Number(n).toFixed(d);
  switch (kind) {
    case 'StreetSegment': {
      const a = find(model, 'Intersection', e.from);
      const b = find(model, 'Intersection', e.to);
      rows.push(row('streetName', e.streetName), row('length', `${fmt(segmentLength(model, e), 0)} m`),
        row('width', `${e.width} m`), row('sidewalkWidth', `${e.sidewalkWidth} m`),
        row('elevation', `${fmt(e.elevation)} m`), row('slope (derived)', `${fmt(segmentSlope(model, e), 2)} %`),
        row('surface', e.surface));
      rel.push(`connects ${link('Intersection', a.id, a.name)} → ${link('Intersection', b.id, b.name)}`);
      const on = (list, k) => list.filter((x) => x.segment === e.id).map((x) => link(k, x.id, x.name || x.station || `${x.id}${x.type ? ` (${pretty(x.type)})` : ''}`));
      const things = [...on(model.buildings, 'Building'), ...on(model.parkingGarages, 'ParkingGarage'),
        ...on(model.subwayEntrances, 'SubwayEntrance'), ...on(model.drainageInlets, 'DrainageInlet'),
        ...on(model.streetFurniture, 'StreetFurniture')];
      if (things.length) rel.push(`has on it: ${things.join(', ')}`);
      break;
    }
    case 'Intersection':
      rows.push(row('name', e.name), row('elevation (derived)', `${fmt(intersectionElevation(model, e.id), 2)} m`),
        row('hasTrafficSignal', e.hasTrafficSignal), row('hasCurbRamp', e.hasCurbRamp));
      rel.push(`connects ${connectedSegments(model, e.id).map((s) => link('StreetSegment', s.id, `${s.id} ${s.streetName}`)).join(', ')}`);
      break;
    case 'Building': {
      rows.push(row('name', e.name), row('use', e.use), row('floors', e.floors), row('hasBasement', e.hasBasement),
        row('hasAwning', e.hasAwning));
      rel.push(`faces ${link('StreetSegment', e.segment)}`);
      const d = dockOf(model, e.id);
      const v = vaultOf(model, e.id);
      if (d) rel.push(`has loading dock ${link('LoadingDock', d.id)}`);
      if (v) rel.push(`basement covered by ${link('SidewalkVault', v.id)}`);
      break;
    }
    case 'LoadingDock': {
      const b = find(model, 'Building', e.building);
      rows.push(row('height', `${fmt(e.height)} m`), row('hasRamp', e.hasRamp));
      rel.push(`attached to ${link('Building', b.id, b.name)}`, `raised above ${link('StreetSegment', b.segment)}`);
      break;
    }
    case 'SidewalkVault': {
      const b = find(model, 'Building', e.building);
      rows.push(row('area', `${e.area} m²`), row('condition', e.condition));
      rel.push(`covers basement of ${link('Building', b.id, b.name)}`, `located on ${link('StreetSegment', b.segment)}`);
      break;
    }
    case 'SubwayEntrance':
      rows.push(row('station', e.station), row('width', `${e.width} m`));
      rel.push(`located on ${link('StreetSegment', e.segment)}`, `leads down to ${e.station} station`);
      break;
    case 'DrainageInlet':
      rows.push(row('type', pretty(e.type)), row('hasCover', e.hasCover));
      rel.push(`located on ${link('StreetSegment', e.segment)}`);
      break;
    case 'ParkingGarage':
      rows.push(row('levels', e.levels), row('upperLevelElevation (derived)', `${fmt(garageUpperLevelElevation(model, e))} m`));
      rel.push(`located on ${link('StreetSegment', e.segment)}`);
      break;
    case 'StreetFurniture':
      rows.push(row('type', pretty(e.type)));
      rel.push(`located on ${link('StreetSegment', e.segment)}`);
      break;
  }
  return { rows, rel };
}

function renderInfo() {
  const entity = selection && find(model, selection.kind, selection.id);
  if (!entity) {
    const counts = Object.entries(KINDS).map(([k, key]) => row(k, model[key].length)).join('');
    info.innerHTML = `
      <h2>${model.name}</h2>
      <p class="muted">Physical site model. Elevation is exaggerated ×3 so slopes are visible.</p>
      <table>${counts}</table>
      <h3>Legend</h3>
      <ul class="legend">
        <li><i style="background:#d8c3a5"></i>shop</li>
        <li><i style="background:#c9785a"></i>restaurant</li>
        <li><i style="background:#8d9aa6"></i>loft</li>
        <li><i style="background:#8a7a68"></i>cobblestone</li>
        <li><i style="background:#8fd3e8"></i>vault intact</li>
        <li><i style="background:#e0b44c"></i>vault cracked</li>
        <li><i style="background:#c0392b"></i>vault broken</li>
        <li><i style="background:#d9b23a"></i>dock ramp</li>
      </ul>`;
    return;
  }
  const { rows, rel } = describe(selection.kind, entity);
  info.innerHTML = `
    <h2>${selection.kind} <span class="muted">${entity.id}</span></h2>
    <table>${rows.join('')}</table>
    <h3>Relationships</h3>
    <ul class="rel">${rel.map((r) => `<li>${r}</li>`).join('')}</ul>
    <button id="deselect" class="ghost">Clear selection</button>`;
  info.querySelector('#deselect').addEventListener('click', () => select(null));
}

info.addEventListener('click', (ev) => {
  const a = ev.target.closest('a[data-kind]');
  if (!a) return;
  ev.preventDefault();
  select({ kind: a.dataset.kind, id: a.dataset.id }, true);
});

// ---------- Selection, toast, refresh ----------

let toastTimer;
function showToast(msg, isOk) {
  toast.textContent = msg;
  toast.className = `show ${isOk ? 'ok' : 'err'}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = ''; }, 3500);
}

function select(sel, focus = false) {
  selection = sel;
  renderToolbar();
  renderInfo();
  view.highlight(selection);
  if (focus) {
    const p = view.focusPoint(model, selection);
    if (p) {
      const offset = view.camera.position.clone().sub(controls.target);
      controls.target.copy(p);
      view.camera.position.copy(p.clone().add(offset.setLength(Math.min(offset.length(), 160))));
    }
  }
}

function refresh() {
  view.render(model);
  view.setLabels(labelsOn);
  select(selection);
}

// Click (not drag) to select.
let down = null;
view.renderer.domElement.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; });
view.renderer.domElement.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
  select(view.pick(e.clientX, e.clientY));
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') select(null);
  if ((e.key === 'Delete' || e.key === 'Backspace') && selection && document.activeElement === document.body) {
    const entity = find(model, selection.kind, selection.id);
    if (entity) runAction(() => actions.remove(model, selection.kind, entity));
  }
});

document.getElementById('btn-reset').addEventListener('click', () => {
  model = createModel();
  selection = null;
  refresh();
  showToast('Site reset to the example.', true);
});
document.getElementById('btn-labels').addEventListener('click', (e) => {
  labelsOn = !labelsOn;
  e.currentTarget.setAttribute('aria-pressed', String(labelsOn));
  view.setLabels(labelsOn);
});
document.getElementById('btn-view').addEventListener('click', (e) => {
  const top = e.currentTarget.dataset.view !== 'top';
  e.currentTarget.dataset.view = top ? 'top' : 'perspective';
  e.currentTarget.textContent = top ? '3D view' : 'Top view';
  setCamera(top ? 'top' : 'perspective');
});

refresh();

(function animate() {
  requestAnimationFrame(animate);
  controls.update();
  view.renderer.render(view.scene, view.camera);
})();
