/**
 * convert-tests.js
 *
 * Extracts the test-case arrays from every *-transforms.test.js file in
 * yomitan/test/language/ and writes one JSON file per language into tests/.
 *
 * Strategy (no AST parser needed):
 *   1. Copy the test file to a temp file in this directory.
 *   2. Strip every import statement.
 *   3. Remove the LanguageTransformer instantiation / addDescriptor call.
 *   4. Replace the final testLanguageTransformer(...) call with `export { tests };`.
 *   5. Dynamically import the patched file and serialise `tests`.
 *   6. Delete the temp file.
 *
 * The output shape per file is an array of test-group objects:
 *   [
 *     {
 *       "category": "nominalization",
 *       "valid": true,
 *       "tests": [
 *         { "term": "...", "source": "...", "rule": "...", "reasons": ["..."] }
 *       ]
 *     },
 *     ...
 *   ]
 */

import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { globSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_DIR  = resolve(__dirname, 'yomitan/test/language');
const TMP       = resolve(__dirname, 'temp-test.js');
const OUT_DIR   = resolve(__dirname, 'tests');

mkdirSync(OUT_DIR, { recursive: true });

const sources = globSync(`${TEST_DIR}/*-transforms.test.js`).sort();

for (const src of sources) {
    // Derive output name: "japanese-transforms.test.js" → "japanese-transforms.json"
    const name    = basename(src, '.test.js');
    const outFile = resolve(OUT_DIR, `${name}.json`);

    let source = readFileSync(src, 'utf8');

    // ── 1. Remove all import statements ──────────────────────────────────────
    source = source.replace(/^import\s.+?from\s+['"][^'"]+['"];?\s*$/gm, '');

    // ── 2. Remove LanguageTransformer boilerplate lines ──────────────────────
    source = source.replace(/^const languageTransformer\s*=.*$/gm, '');
    source = source.replace(/^languageTransformer\.\w+\(.*\);?\s*$/gm, '');

    // ── 3. Replace test runner call with an export ────────────────────────────
    //    handles: testLanguageTransformer(transformer, tests);
    //         and: testLanguageTransformer(transformer, tests, extraArg);
    source = source.replace(
        /^testLanguageTransformer\s*\(.*\);?\s*$/gm,
        'export { tests };',
    );

    writeFileSync(TMP, source, 'utf8');

    // ── 4. Dynamic import ─────────────────────────────────────────────────────
    const tmpUrl = pathToFileURL(TMP).href + `?v=${Date.now()}`;
    let mod;
    try {
        mod = await import(tmpUrl);
    } catch (err) {
        console.warn(`⚠  Failed to import ${src}: ${err.message}`);
        unlinkSync(TMP);
        continue;
    }

    if (!mod.tests) {
        console.warn(`⚠  No 'tests' export found in ${src}, skipping.`);
        unlinkSync(TMP);
        continue;
    }

    // ── 5. Serialise ──────────────────────────────────────────────────────────
    writeFileSync(outFile, JSON.stringify(mod.tests, null, 2), 'utf8');
    unlinkSync(TMP);

    console.log(`✓  tests/${name}.json`);
}

console.log(`\nDone — converted ${sources.length} file(s).`);
