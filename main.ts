// VICE CUT push round 10 — gta6-cover-art-01 entry program (Node 22, stdlib only).
// The app is this directory's app/ folder: plain static files a desktop browser
// loads offline (app/index.html and its ES modules, no library, no network
// request). This program hands it in: it copies app/ and screenshots/ from
// beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library.
//
// Guards, written in from the start so a stale or oversize build can never
// slip through: any screenshot over 256 KiB is refused before copying; stale
// out/app, out/screenshots and out/dossier.json are cleared before copying;
// a zero-byte dossier is refused instead of being handed in.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SCREENSHOT_BYTES = 262144;
const MAX_SCREENSHOTS = 4;

// Refuse an output directory inside this repository: a hand-in run once
// wrote out/ next to the sources and it was committed by mistake. The
// output belongs outside the snapshot (or in /output in the grader).
{
  const outAbs = resolve(here, out);
  const rootAbs = resolve(here);
  if (outAbs === rootAbs || outAbs.startsWith(rootAbs + sep)) {
    throw new Error(`MAKEFUN_OUTPUT_DIR must be outside the repository, not ${out}`);
  }
}

// Refuse an oversize screenshot before anything is copied: the scorer caps
// every screenshot at 256 KiB, so a bigger file would fail the gate outright.
const shotDir = join(here, 'screenshots');
if (existsSync(shotDir)) {
  const shots = readdirSync(shotDir).filter((name) => !name.startsWith('.'));
  if (shots.length > MAX_SCREENSHOTS) throw new Error(`too many screenshots: ${shots.length} (max ${MAX_SCREENSHOTS})`);
  for (const name of shots) {
    const size = statSync(join(shotDir, name)).size;
    if (size > MAX_SCREENSHOT_BYTES) throw new Error(`screenshot ${name} is ${size} bytes (max ${MAX_SCREENSHOT_BYTES})`);
  }
}

// Clear stale output first, so nothing from an earlier build can survive.
for (const stale of ['app', 'screenshots', 'dossier.json']) {
  const target = join(out, stale);
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shotDir)) cpSync(shotDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: MAX_SCREENSHOTS, max_bytes: MAX_SCREENSHOT_BYTES },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

// Refuse a zero-byte dossier: an empty judge summary is a broken hand-in.
// Also refuse a dossier that is not well-formed JSON: buildDossier returns
// bytes, so decode them first (parsing the raw bytes would read them as a
// comma list, not JSON) and parse the text before handing it in.
if (!dossier || dossier.length === 0) throw new Error('dossier is empty, refusing to hand in');
try {
  JSON.parse(new TextDecoder('utf-8').decode(dossier));
} catch {
  throw new Error('dossier is not well-formed JSON, refusing to hand in');
}
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`VICE CUT handed in: ${dossier.length} bytes of dossier, ${readdirSync(join(out, 'screenshots')).length} screenshots`);
