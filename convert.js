/**
 * convert.js
 *
 * Converts every *-transforms.js file found under
 * yomitan/ext/js/language/ into a matching static *.json file in the
 * root of this repository.
 *
 * Steps for each file:
 *   1. Copy it to a temporary file in this directory.
 *   2. Rewrite its import to point at ./mock-transforms.js.
 *   3. Dynamically import the patched file (cache-busted so re-runs work).
 *   4. JSON-stringify the first exported object and write <name>.json.
 *   5. Delete the temporary file.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { globSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LANG_DIR  = resolve(__dirname, 'yomitan/ext/js/language');
const TMP       = resolve(__dirname, 'temp-transforms.js');

// Collect all *-transforms.js files, excluding the base language-transforms.js
const sources = globSync(`${LANG_DIR}/**/*-transforms.js`)
    .filter(f => basename(f) !== 'language-transforms.js')
    .sort();

for (const src of sources) {
    const name    = basename(src, '.js');           // e.g. japanese-transforms
    const outFile = resolve(__dirname, `${name}.json`);

    // ── 1 & 2. Patch the import path ────────────────────────────────────────
    let source = readFileSync(src, 'utf8');
    source = source.replace(
        /from\s+['"]\.\.\/language-transforms\.js['"]/g,
        "from './mock-transforms.js'",
    );
    writeFileSync(TMP, source, 'utf8');

    // ── 3. Dynamic import (cache-busted) ────────────────────────────────────
    const tmpUrl = pathToFileURL(TMP).href + `?v=${Date.now()}`;
    const mod = await import(tmpUrl);

    // ── 4. Find the first exported object and serialise ──────────────────────
    const exported = Object.values(mod).find(v => v !== null && typeof v === 'object');
    if (!exported) {
        console.warn(`⚠  No object export found in ${src}, skipping.`);
        unlinkSync(TMP);
        continue;
    }
    writeFileSync(outFile, JSON.stringify(exported, null, 2), 'utf8');

    // ── 5. Clean up ──────────────────────────────────────────────────────────
    unlinkSync(TMP);

    console.log(`✓  ${name}.json`);
}

console.log(`\nDone — converted ${sources.length} file(s).`);
