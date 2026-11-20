// VICE CUT studio — wires the 3-step editor: photos, style, text + export.
// Step 1: drop photos, click to place into hero or supporting panels, crop + pan
// + zoom per panel. Step 2: pick a grade + poster style. Step 3: edit the
// title/tagline/billing and export the PNG in 1080x1080, 1080x1350, 1920x1080.
import { drawCover, exportPNG, ensureFonts, GRADES, LAYOUTS, panelAtPoint } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');

export const SAMPLES = [
  { key: 'lucia', file: 'lucia.jpg', name: 'LUCIA', role: 'DRIVER' },
  { key: 'nova', file: 'nova.jpg', name: 'NOVA', role: 'GETAWAY' },
  { key: 'rae', file: 'rae.jpg', name: 'RAE', role: 'LOOKOUT' },
  { key: 'jason', file: 'jason.jpg', name: 'JASON', role: 'FIXER' },
  { key: 'diego', file: 'diego.jpg', name: 'DIEGO', role: 'WHEELMAN' },
  { key: 'marcus', file: 'marcus.jpg', name: 'MARCUS', role: 'MUSCLE' },
];

export const state = {
  layout: 'heroGrid',
  grade: 'sunset',
  title: 'VICE CUT',
  tagline: 'Painted in Leonida.',
  ribbon: 'SIX RIDES · ONE COAST · NO WAY BACK',
  quote: '“The coast has never looked this dangerous.” — VICE PRESS',
  billing: 'VICE CUT FILMS PRESENTS LUCIA MARLOWE · JASON REYES · NOVA KANE · RAE SOLANO · DIEGO VOSS — A LEONIDA PICTURE — IN THEATRES NOW',
  panels: {
    hero: { sample: 'lucia', name: 'LUCIA', role: 'DRIVER', zoom: 1.12, panX: 0, panY: -0.15 },
    leftTop: { sample: 'rae', name: 'RAE', role: 'LOOKOUT', zoom: 1.05, panX: 0, panY: 0 },
    leftBottom: { sample: 'nova', name: 'NOVA', role: 'GETAWAY', zoom: 1.15, panX: 0, panY: -0.5, zoomLand: 1.0, panYLand: -0.1 },
    rightTop: { sample: 'jason', name: 'JASON', role: 'FIXER', zoom: 1.05, panX: 0, panY: 0 },
    rightBottom: { sample: 'diego', name: 'DIEGO', role: 'WHEELMAN', zoom: 1.35, panX: 0, panY: -1, zoomLand: 1.1, panYLand: -0.76 },
  },
  images: {},
  selected: 'hero',
};

let lastMark = null;

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${url}`));
    img.src = url;
  });
}

/** Loads every bundled sample photo once, on the person's own machine. */
export async function loadSamples() {
  for (const s of SAMPLES) {
    if (!state.images[s.key]) state.images[s.key] = await loadImage(`./samples/${s.file}`);
  }
  for (const key of Object.keys(state.panels)) {
    const p = state.panels[key];
    if (!state.images[key] && p.sample && state.images[p.sample]) state.images[key] = state.images[p.sample];
  }
}

/** Redraws the live preview from the current state. */
export function redraw() {
  lastMark = drawCover(canvas, state);
  syncCropControls();
  return lastMark;
}

/** Measures the live wordmark: fraction of the cover width it spans. */
export function measureTitle() {
  if (!lastMark) redraw();
  return lastMark ? lastMark.mark : null;
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

/** Places a sample (or an uploaded photo) into a panel slot. */
export function placePanel(panelKey, sampleKey, img, name, role) {
  state.panels[panelKey] = {
    ...(state.panels[panelKey] || {}),
    sample: sampleKey,
    name: name || state.panels[panelKey]?.name || 'GUEST',
    role: role || state.panels[panelKey]?.role || 'CREW',
  };
  if (img) state.images[panelKey] = img;
  else if (sampleKey && state.images[sampleKey]) state.images[panelKey] = state.images[sampleKey];
  state.selected = panelKey;
  redraw();
}

/** Fills every panel from one photo, or deals the samples across the panels. */
export function fillPanels(mode) {
  const keys = ['hero', 'leftTop', 'leftBottom', 'rightTop', 'rightBottom'];
  if (mode === 'one') {
    const src = state.panels.hero;
    for (const k of keys) placePanel(k, src.sample, state.images.hero, src.name, src.role);
  } else {
    const deal = ['lucia', 'nova', 'rae', 'jason', 'diego'];
    keys.forEach((k, i) => {
      const s = SAMPLES.find((x) => x.key === deal[i]);
      placePanel(k, s.key, state.images[s.key], s.name, s.role);
    });
  }
  setStatus(mode === 'one' ? 'One photo fills all five panels.' : 'Samples dealt across all five panels.');
}

/** Crops the selected panel: zoom and pan. */
export function cropPhoto(panelKey, zoom, panX, panY) {
  const p = state.panels[panelKey];
  if (!p) return;
  if (zoom !== undefined) p.zoom = Math.min(2.5, Math.max(0.8, zoom));
  if (panX !== undefined) p.panX = Math.min(1, Math.max(-1, panX));
  if (panY !== undefined) p.panY = Math.min(1, Math.max(-1, panY));
  redraw();
}

/** Moves the selected panel's photo by dragging on the preview. */
export function positionPhoto(panelKey, dx, dy) {
  const p = state.panels[panelKey];
  if (!p) return;
  p.panX = Math.min(1, Math.max(-1, (p.panX || 0) + dx));
  p.panY = Math.min(1, Math.max(-1, (p.panY || 0) + dy));
  redraw();
}

/** Picks a colour grade and repaints the whole poster. */
export function pickGrade(grade) {
  if (!GRADES[grade]) return;
  state.grade = grade;
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('on', b.dataset.grade === grade));
  redraw();
}

/** Picks a poster style and repaints the whole poster. */
export function pickPosterStyle(layout) {
  if (!LAYOUTS[layout]) return;
  state.layout = layout;
  document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('on', b.dataset.layout === layout));
  redraw();
}

/** Edits the title wordmark text. */
export function editTitle(text) {
  state.title = text.trim().toUpperCase() || 'VICE CUT';
  redraw();
}

/** Edits the script tagline under the wordmark. */
export function editCaption(text) {
  state.tagline = text.trim() || 'Painted in Leonida.';
  redraw();
}

/** Edits the story ribbon line. */
export function editRibbon(text) {
  state.ribbon = text.trim().toUpperCase() || 'SIX RIDES · ONE COAST · NO WAY BACK';
  redraw();
}

/** Exports the cover as a PNG at an exact post size and downloads it. */
export async function exportCoverPNG(w, h) {
  setStatus(`Exporting ${w} x ${h}…`);
  const blob = await exportPNG(state, w, h);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cut-${w}x${h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  setStatus(`Saved vice-cut-${w}x${h}.png — ${Math.round(blob.size / 1024)} KiB.`);
  return blob;
}

/** Uploads a photo from the person's machine into the selected panel. */
export async function uploadPhoto(file) {
  if (!file) return;
  const img = await loadImage(URL.createObjectURL(file));
  const key = state.selected || 'hero';
  placePanel(key, 'upload', img, state.panels[key]?.name || 'GUEST', state.panels[key]?.role || 'CREW');
  setStatus(`Your photo is in the ${key} panel — drag it to position, zoom to crop.`);
}

function syncCropControls() {
  const p = state.panels[state.selected];
  if (!p) return;
  const zoom = document.getElementById('zoom');
  const panX = document.getElementById('panx');
  const panY = document.getElementById('pany');
  const label = document.getElementById('selectedPanel');
  if (zoom) zoom.value = p.zoom ?? 1;
  if (panX) panX.value = p.panX ?? 0;
  if (panY) panY.value = p.panY ?? 0;
  if (label) label.textContent = `${state.selected} — ${p.name || ''} ${p.role || ''}`.trim();
}

function buildSampleStrip() {
  const strip = document.getElementById('samples');
  if (!strip) return;
  strip.innerHTML = '';
  for (const s of SAMPLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sample';
    b.dataset.sample = s.key;
    const img = document.createElement('img');
    img.src = `./samples/${s.file}`;
    img.alt = `${s.name}, ${s.role}`;
    b.appendChild(img);
    const cap = document.createElement('span');
    cap.textContent = s.name;
    b.appendChild(cap);
    b.addEventListener('click', () => {
      placePanel(state.selected || 'hero', s.key, state.images[s.key], s.name, s.role);
      setStatus(`${s.name} placed in the ${state.selected} panel.`);
    });
    strip.appendChild(b);
  }
}

function wireEditor() {
  document.querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => pickGrade(b.dataset.grade)));
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', () => pickPosterStyle(b.dataset.layout)));
  const title = document.getElementById('title');
  if (title) title.addEventListener('input', () => editTitle(title.value));
  const tagline = document.getElementById('tagline');
  if (tagline) tagline.addEventListener('input', () => editCaption(tagline.value));
  const ribbon = document.getElementById('ribbon');
  if (ribbon) ribbon.addEventListener('input', () => editRibbon(ribbon.value));
  const upload = document.getElementById('upload');
  if (upload) upload.addEventListener('change', async (e) => { await uploadPhoto(e.target.files[0]); e.target.value = ''; });
  const fillOne = document.getElementById('fillOne');
  if (fillOne) fillOne.addEventListener('click', () => fillPanels('one'));
  const fillAll = document.getElementById('fillAll');
  if (fillAll) fillAll.addEventListener('click', () => fillPanels('all'));
  const zoom = document.getElementById('zoom');
  if (zoom) zoom.addEventListener('input', () => cropPhoto(state.selected, Number(zoom.value), undefined, undefined));
  const panX = document.getElementById('panx');
  if (panX) panX.addEventListener('input', () => cropPhoto(state.selected, undefined, Number(panX.value), undefined));
  const panY = document.getElementById('pany');
  if (panY) panY.addEventListener('input', () => cropPhoto(state.selected, undefined, undefined, Number(panY.value)));
  for (const [w, h] of [[1080, 1080], [1080, 1350], [1920, 1080]]) {
    const btn = document.getElementById(`export-${w}x${h}`);
    if (btn) btn.addEventListener('click', () => exportCoverPNG(w, h));
  }
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const hit = panelAtPoint(canvas, x, y);
    if (hit) {
      state.selected = hit;
      drag = { x: e.clientX, y: e.clientY, key: hit };
      canvas.setPointerCapture(e.pointerId);
      syncCropControls();
      redraw();
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    positionPhoto(drag.key, ((e.clientX - drag.x) / r.width) * 2, ((e.clientY - drag.y) / r.height) * 2);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
}

// Test + screenshot hook: the page's live state and export path, in one place.
window.__viceCut = { state, redraw, exportPNG: (w, h) => exportPNG(state, w, h), measureTitle, placePanel, fillPanels, pickGrade, pickPosterStyle, editTitle, loadSamples };

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
(async () => {
  await ensureFonts();
  await loadSamples();
  buildSampleStrip();
  wireEditor();
  if (shot) {
    await runShot(shot, params, { state, loadImage, loadSamples, redraw });
  } else {
    redraw();
  }
  setStatus('Samples loaded — click a panel, then a photo, to place it. Drag a photo to position it.');
})();
