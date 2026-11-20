// VICE CUT cover renderer — draws the whole poster on one canvas, in code.
// Hero-grid poster: a huge centre hero, four character panels around it, a tight
// striped wordmark overlapping the photos, magazine furniture, no black zone.
// Every size is drawn from the same state, so the 1080x1080, 1080x1350 and
// 1920x1080 exports are the same cover at three sizes.

export const GRADES = {
  sunset: { name: 'Warm Sunset', filter: 'saturate(1.32) contrast(1.07) brightness(1.05)', top: 'rgba(255,176,66,0.10)', bottom: 'rgba(255,64,110,0.20)', wash: 'rgba(255,150,50,0.10)' },
  neon: { name: 'Neon Night', filter: 'saturate(1.38) contrast(1.10) brightness(0.98)', top: 'rgba(80,40,255,0.16)', bottom: 'rgba(255,40,140,0.22)', wash: 'rgba(120,60,255,0.12)' },
  teal: { name: 'Teal Coast', filter: 'saturate(1.22) contrast(1.05) brightness(1.02)', top: 'rgba(0,190,190,0.13)', bottom: 'rgba(0,60,90,0.20)', wash: 'rgba(0,170,170,0.10)' },
  ink: { name: 'Ink Mono', filter: 'grayscale(1) contrast(1.12) brightness(1.03)', top: 'rgba(255,255,255,0.04)', bottom: 'rgba(0,0,0,0.18)', wash: 'rgba(255,255,255,0.05)' },
};

export const LAYOUTS = {
  heroGrid: 'Hero Grid',
  fullBleed: 'Full-Bleed',
  split: 'Split',
  framed: 'Framed',
};

let fontsReady = null;

/** Loads the two OFL fonts shipped under app/fonts so canvas lettering is exact. */
export function ensureFonts() {
  if (fontsReady) return fontsReady;
  fontsReady = (async () => {
    try {
      const bebas = new FontFace('Bebas Neue', "url(./fonts/bebas-neue.woff2)", { weight: '400' });
      const caveat = new FontFace('Caveat', "url(./fonts/caveat.woff2)", { weight: '700' });
      document.fonts.add(bebas);
      document.fonts.add(caveat);
      await Promise.all([bebas.load(), caveat.load()]);
      await document.fonts.ready;
    } catch (err) {
      console.warn('VICE CUT: bundled font failed, falling back', err);
    }
  })();
  return fontsReady;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Cover-fits one photo into a panel rect, with zoom and pan, then grades it. */
export function drawPhotoPanel(ctx, img, rect, grade, opts = {}) {
  const zoom = opts.zoom ?? 1;
  const panX = opts.panX ?? 0;
  const panY = opts.panY ?? 0;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const ox = Math.max(0, dw - rect.w);
  const oy = Math.max(0, dh - rect.h);
  const dx = rect.x - ox / 2 + (panX * ox) / 2;
  const dy = rect.y - oy / 2 + (panY * oy) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade.filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.filter = 'none';
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.top);
  wash.addColorStop(1, grade.bottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  if (opts.goldenSky) {
    const sky = ctx.createRadialGradient(
      rect.x + rect.w / 2, rect.y + rect.h * 0.08, 4,
      rect.x + rect.w / 2, rect.y + rect.h * 0.08, rect.w * 0.75,
    );
    sky.addColorStop(0, 'rgba(255,196,80,0.55)');
    sky.addColorStop(0.55, 'rgba(255,150,50,0.22)');
    sky.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
  }
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.26)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Small name + role chip sitting ON a photo corner. */
export function drawCastTag(ctx, rect, name, role, W) {
  const pad = Math.max(6, W * 0.006);
  const bar = Math.max(3, W * 0.003);
  const size = Math.max(13, W * 0.016);
  ctx.save();
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  ctx.letterSpacing = '0.06em';
  const label = `${name} — ${role}`;
  const tw = ctx.measureText(label).width;
  const bw = tw + pad * 2 + bar + 4;
  const bh = size * 1.5;
  const x = rect.x + Math.max(5, W * 0.005);
  const y = rect.y + Math.max(5, W * 0.005);
  ctx.fillStyle = 'rgba(8,6,14,0.62)';
  roundRectPath(ctx, x, y, bw, bh, bh * 0.28);
  ctx.fill();
  ctx.fillStyle = '#e8b64c';
  ctx.fillRect(x, y, bar, bh);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + bar + pad, y + bh / 2 + size * 0.04);
  ctx.restore();
}

/** Hero-grid geometry: centre hero, two panels per side column. */
export function heroGridRects(W, H, frame) {
  const ix = frame, iy = frame, iw = W - frame * 2, ih = H - frame * 2;
  const gap = Math.max(2, W * 0.003);
  const sideW = iw * 0.27;
  const heroX = ix + sideW + gap;
  const heroW = iw - sideW * 2 - gap * 2;
  const halfH = (ih - gap) / 2;
  return {
    hero: { x: heroX, y: iy, w: heroW, h: ih },
    leftTop: { x: ix, y: iy, w: sideW, h: halfH },
    leftBottom: { x: ix, y: iy + halfH + gap, w: sideW, h: halfH },
    rightTop: { x: ix + sideW + heroW + gap * 2, y: iy, w: sideW, h: halfH },
    rightBottom: { x: ix + sideW + heroW + gap * 2, y: iy + halfH + gap, w: sideW, h: halfH },
  };
}

/** The tight striped wordmark. Returns its measured span for the slash + checks. */
export function drawWordmark(ctx, W, H, title, baselineY) {
  const landscape = W > H;
  const stretchY = landscape ? 0.8 : 0.85;
  const capFrac = landscape ? 0.185 : 0.16;
  const words = title.trim().toUpperCase().split(/\s+/).filter(Boolean);
  const first = words[0] || 'VICE';
  const rest = words.slice(1).join(' ') || 'CUT';
  ctx.save();
  ctx.letterSpacing = '0.01em';
  // Fit analytically: measure the width per unit size once, then solve for the
  // size that spans 92% of the cover width, capped so the cap height never
  // reaches the faces above. If the cap binds, widen the stretch instead.
  ctx.font = '100px "Bebas Neue", sans-serif';
  const k = (ctx.measureText(first).width + ctx.measureText(rest).width + 42) / 100;
  const capSize = (capFrac * H) / (0.72 * stretchY);
  let stretchX = landscape ? 1.6 : 1.25;
  let size = Math.min((W * 0.92) / (k * stretchX), capSize);
  if (size < (W * 0.92) / (k * stretchX)) {
    stretchX = Math.min(1.85, (W * 0.92) / (k * capSize));
    size = Math.min((W * 0.92) / (k * stretchX), capSize);
  }
  ctx.font = `${size}px "Bebas Neue", sans-serif`;
  const wFirst = ctx.measureText(first).width;
  const wRest = ctx.measureText(rest).width;
  const gap = size * 0.42;
  const totalW = (wFirst + gap + wRest) * stretchX;
  const capH = size * 0.72 * stretchY;
  const offW = Math.ceil(totalW + size * 0.2);
  const offH = Math.ceil(size * 1.25);
  const off = document.createElement('canvas');
  off.width = offW;
  off.height = offH;
  const o = off.getContext('2d');
  o.letterSpacing = '0.01em';
  o.font = `${size}px "Bebas Neue", sans-serif`;
  o.textBaseline = 'alphabetic';
  o.textAlign = 'left';
  o.lineJoin = 'round';
  const ox = size * 0.1;
  const oy = size * 0.92;
  o.save();
  o.translate(ox, 0);
  o.scale(stretchX, stretchY);
  o.lineWidth = size * 0.07;
  o.strokeStyle = '#160a12';
  o.strokeText(first, 0, oy);
  o.strokeText(rest, wFirst + gap, oy);
  const gradFirst = o.createLinearGradient(0, oy - size * 0.72, 0, oy);
  gradFirst.addColorStop(0, '#ffffff');
  gradFirst.addColorStop(0.55, '#ffffff');
  gradFirst.addColorStop(0.78, '#ffe9a8');
  gradFirst.addColorStop(1, '#ffb26b');
  o.fillStyle = gradFirst;
  o.fillText(first, 0, oy);
  const gradRest = o.createLinearGradient(0, oy - size * 0.72, 0, oy);
  gradRest.addColorStop(0, '#ff5e8a');
  gradRest.addColorStop(0.55, '#e14fd8');
  gradRest.addColorStop(1, '#7b5cff');
  o.fillStyle = gradRest;
  o.fillText(rest, wFirst + gap, oy);
  o.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 6; i += 2) {
    o.fillStyle = 'rgba(255,255,255,0.10)';
    o.fillRect(0, (oy - size * 0.72) + (i * size * 0.72) / 6, wFirst + gap + wRest, (size * 0.72) / 6);
  }
  o.globalCompositeOperation = 'source-over';
  o.restore();
  const drawX = (W - totalW) / 2 - size * 0.1;
  const drawY = baselineY - size * 0.92 * stretchY;
  ctx.shadowColor = 'rgba(255,46,136,0.85)';
  ctx.shadowBlur = size * 0.10;
  ctx.drawImage(off, drawX, drawY);
  ctx.restore();
  // Neon slash slicing between the two words, leaning ~30 degrees, never on a face.
  const slashX = drawX + size * 0.1 + (wFirst + gap / 2) * stretchX;
  const slashTop = baselineY - capH * 1.08;
  const slashBottom = baselineY + capH * 0.10;
  const slashH = slashBottom - slashTop;
  const lean = slashH * 0.30;
  const sw = size * 0.085;
  ctx.save();
  const sg = ctx.createLinearGradient(slashX, slashTop, slashX, slashBottom);
  sg.addColorStop(0, '#ff5e8a');
  sg.addColorStop(1, '#7b5cff');
  ctx.fillStyle = sg;
  ctx.shadowColor = 'rgba(255,46,136,0.9)';
  ctx.shadowBlur = size * 0.06;
  ctx.beginPath();
  ctx.moveTo(slashX - sw / 2 + lean, slashTop);
  ctx.lineTo(slashX + sw / 2 + lean, slashTop);
  ctx.lineTo(slashX + sw / 2 - lean, slashBottom);
  ctx.lineTo(slashX - sw / 2 - lean, slashBottom);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  return { titleWidth: totalW, width: W, fraction: totalW / W, top: baselineY - capH, baseline: baselineY, size };
}

/** Magazine furniture: frame, stars, seal, barcode, ribbon, quote, billing. */
export function drawMagazineFurniture(ctx, W, H, state) {
  const frame = Math.max(6, W * 0.008);
  const gold = '#e8b64c';
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = Math.max(3, W * 0.004);
  ctx.strokeRect(frame / 2, frame / 2, W - frame, H - frame);
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  ctx.strokeRect(frame + 5, frame + 5, W - frame * 2 - 10, H - frame * 2 - 10);
  ctx.globalAlpha = 1;
  // Five gold stars, top centre, over the hero sky.
  ctx.fillStyle = gold;
  ctx.font = `${Math.max(13, H * 0.02)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★', W / 2, H * 0.042);
  // Round seal, top right corner, tilted like a stamp.
  const sr = H * 0.045;
  const scx = W - frame - sr - W * 0.012;
  const scy = frame + sr + H * 0.012;
  ctx.translate(scx, scy);
  ctx.rotate(-0.21);
  ctx.beginPath();
  ctx.arc(0, 0, sr, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,6,16,0.72)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, sr * 0.08);
  ctx.strokeStyle = gold;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, sr * 0.78, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = gold;
  ctx.font = `${sr * 0.72}px "Bebas Neue", sans-serif`;
  ctx.fillText('VC', 0, -sr * 0.08);
  ctx.font = `${sr * 0.26}px "Bebas Neue", sans-serif`;
  ctx.fillText('EST. 2026', 0, sr * 0.48);
  ctx.restore();
  // Barcode chip, bottom right.
  const bw = W * 0.105;
  const bh = H * 0.038;
  const bx = W - frame - bw - W * 0.012;
  const by = H * 0.938;
  ctx.save();
  ctx.fillStyle = 'rgba(8,6,14,0.72)';
  roundRectPath(ctx, bx, by, bw, bh, 3);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  let barX = bx + bw * 0.06;
  const barTop = by + bh * 0.14;
  const barH = bh * 0.56;
  const bars = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 2];
  for (const b of bars) {
    const wdt = Math.max(1, (bw * 0.88 * b) / 34);
    ctx.fillRect(barX, barTop, wdt, barH);
    barX += wdt + Math.max(1, bw * 0.012);
    if (barX > bx + bw * 0.94) break;
  }
  ctx.font = `${Math.max(8, H * 0.009)}px "Bebas Neue", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('0 12345 67890 1', bx + bw / 2, by + bh * 0.85);
  ctx.restore();
  // "VOL. 06" bottom left, on the billing line.
  ctx.save();
  ctx.font = `${Math.max(11, H * 0.016)}px "Bebas Neue", sans-serif`;
  ctx.letterSpacing = '0.14em';
  ctx.fillStyle = gold;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('VOL. 06 · LEONIDA', frame + W * 0.014, H * (W > H ? 0.987 : 0.980));
  ctx.restore();
}

/** Dark scrim under the title so the wordmark reads over bright photos. */
function drawTitleScrim(ctx, W, H) {
  const g = ctx.createLinearGradient(0, H * 0.60, 0, H * 0.92);
  g.addColorStop(0, 'rgba(8,4,14,0)');
  g.addColorStop(0.45, 'rgba(8,4,14,0.28)');
  g.addColorStop(1, 'rgba(8,4,14,0.82)');
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.60, W, H * 0.32);
}

/** Full poster for one size. `state.images` maps panel keys to HTMLImages. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const layout = state.layout || 'heroGrid';
  const frame = Math.max(6, W * 0.008);
  const landscape = W > H;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#14060f';
  ctx.fillRect(0, 0, W, H);
  const panels = state.panels || {};
  const img = (key) => state.images && state.images[key];
  // Landscape compensation, tuned per face: the bottom panels' faces sit at
  // different heights in their source photos, so each carries its own
  // landscape zoom/pan (measured from the samples, verified in all 3 sizes).
  const eff = (key, base) => {
    const p = { ...(base || {}) };
    if (landscape && p.zoomLand !== undefined) p.zoom = p.zoomLand;
    if (landscape && p.panYLand !== undefined) p.panY = p.panYLand;
    if (landscape && key === 'hero') p.panY = Math.max(-1, (p.panY ?? 0) - 0.15);
    return p;
  };

  if (layout === 'fullBleed') {
    const heroImg = img('hero');
    if (heroImg) drawPhotoPanel(ctx, heroImg, { x: 0, y: 0, w: W, h: H }, grade, { ...eff('hero', panels.hero), goldenSky: true });
  } else if (layout === 'split') {
    const heroImg = img('hero');
    if (heroImg) drawPhotoPanel(ctx, heroImg, { x: 0, y: 0, w: W, h: H * 0.66 }, grade, { ...eff('hero', panels.hero), goldenSky: true });
    ctx.fillStyle = '#14060f';
    ctx.fillRect(0, H * 0.66, W, H * 0.34);
  } else if (layout === 'framed') {
    const heroImg = img('hero');
    const m = W * 0.06;
    ctx.fillStyle = '#f6f1e3';
    ctx.fillRect(0, 0, W, H);
    if (heroImg) drawPhotoPanel(ctx, heroImg, { x: m, y: m, w: W - m * 2, h: H * 0.78 }, grade, { ...eff('hero', panels.hero), goldenSky: true });
  } else {
    const r = heroGridRects(W, H, frame);
    const order = ['leftTop', 'leftBottom', 'rightTop', 'rightBottom'];
    for (const key of order) {
      const shot = img(key);
      if (shot) drawPhotoPanel(ctx, shot, r[key], grade, eff(key, panels[key]));
    }
    const heroImg = img('hero');
    if (heroImg) drawPhotoPanel(ctx, heroImg, r.hero, grade, { ...eff('hero', panels.hero), goldenSky: true });
    drawCastTag(ctx, r.hero, panels.hero?.name || 'LUCIA', panels.hero?.role || 'DRIVER', W);
    drawCastTag(ctx, r.leftTop, panels.leftTop?.name || 'RAE', panels.leftTop?.role || 'LOOKOUT', W);
    drawCastTag(ctx, r.leftBottom, panels.leftBottom?.name || 'NOVA', panels.leftBottom?.role || 'GETAWAY', W);
    drawCastTag(ctx, r.rightTop, panels.rightTop?.name || 'JASON', panels.rightTop?.role || 'FIXER', W);
    drawCastTag(ctx, r.rightBottom, panels.rightBottom?.name || 'DIEGO', panels.rightBottom?.role || 'WHEELMAN', W);
  }

  if (layout !== 'split') drawTitleScrim(ctx, W, H);
  const baselineY = H * (landscape ? 0.925 : 0.905);
  const mark = drawWordmark(ctx, W, H, state.title || 'VICE CUT', baselineY);
  // Script signature under the wordmark.
  ctx.save();
  ctx.font = `700 ${Math.max(16, H * 0.028)}px Caveat, cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd76a';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 4;
  ctx.fillText(state.tagline || 'Painted in Leonida.', W / 2, H * (landscape ? 0.941 : 0.928));
  ctx.restore();
  // Press-quote + story ribbon band.
  const bandY = H * (landscape ? 0.950 : 0.940);
  const bandH = H * (landscape ? 0.030 : 0.034);
  ctx.save();
  ctx.fillStyle = 'rgba(10,5,16,0.82)';
  ctx.fillRect(frame, bandY, W - frame * 2, bandH);
  ctx.fillStyle = '#e8b64c';
  ctx.fillRect(frame, bandY, W - frame * 2, Math.max(1, H * 0.0018));
  ctx.fillRect(frame, bandY + bandH, W - frame * 2, Math.max(1, H * 0.0018));
  ctx.font = `700 ${Math.max(12, H * 0.019)}px Caveat, cursive`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const quote = state.quote || '“The coast has never looked this dangerous.” — VICE PRESS';
  ctx.fillText(quote, W / 2, bandY + bandH * 0.29, W * 0.72);
  ctx.font = `${Math.max(11, H * 0.015)}px "Bebas Neue", sans-serif`;
  ctx.letterSpacing = '0.16em';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText(state.ribbon || 'SIX RIDES · ONE COAST · NO WAY BACK', W / 2, bandY + bandH * 0.78, W * 0.72);
  ctx.restore();
  // Tiny billing block, very bottom centre.
  ctx.save();
  ctx.font = `${Math.max(8, H * 0.009)}px "Bebas Neue", sans-serif`;
  ctx.letterSpacing = '0.08em';
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const billing = state.billing || 'VICE CUT FILMS PRESENTS LUCIA MARLOWE · JASON REYES · NOVA KANE · RAE SOLANO · DIEGO VOSS — A LEONIDA PICTURE — IN THEATRES NOW';
  ctx.fillText(billing, W / 2, H * (landscape ? 0.987 : 0.980), W * 0.56);
  ctx.restore();
  drawMagazineFurniture(ctx, W, H, state);
  return { mark, layout, grade: state.grade };
}

/** Renders the same cover at an exact export size and returns a PNG blob. */
export async function exportPNG(state, w, h) {
  await ensureFonts();
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('export failed'))), 'image/png');
  });
}

/** Which hero-grid panel (if any) contains a point on the preview canvas. */
export function panelAtPoint(canvas, x, y) {
  const r = heroGridRects(canvas.width, canvas.height, Math.max(6, canvas.width * 0.008));
  for (const key of ['hero', 'leftTop', 'leftBottom', 'rightTop', 'rightBottom']) {
    const p = r[key];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return key;
  }
  return null;
}
