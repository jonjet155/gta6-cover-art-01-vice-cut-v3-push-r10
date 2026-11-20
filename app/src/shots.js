// Fixed scenes for screenshots: ?shot=cover shows the cover alone, full frame;
// ?shot=editor shows the studio with the samples loaded and the 3-step flow
// visible. Params: layout, grade, title, tagline, ribbon, size.
// window.__shotReady is set once the cover is painted.
import { ensureFonts } from './cover.js';

export async function runShot(shot, query, ctx) {
  const { state, loadSamples, redraw } = ctx;
  await ensureFonts();
  await loadSamples();
  const layout = query.get('layout');
  if (layout) state.layout = layout;
  const grade = query.get('grade');
  if (grade) state.grade = grade;
  const title = query.get('title');
  if (title) state.title = title.toUpperCase();
  const tagline = query.get('tagline');
  if (tagline) state.tagline = tagline;
  const ribbon = query.get('ribbon');
  if (ribbon) state.ribbon = ribbon.toUpperCase();
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = (query.get('size') || '1280x720').split('x');
    const canvas = document.getElementById('cover');
    canvas.width = Number(size[0]) || 1280;
    canvas.height = Number(size[1]) || 720;
  }
  redraw();
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
