const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { contentScriptEntries } = require('./content-scripts-config');

const srcDir = path.join(__dirname, '../src/content');
const outDir = path.join(__dirname, '../dist/content/scripts');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

Promise.all(
  contentScriptEntries.map(async (entry) => {
    let relPath, outFile;
    if (typeof entry === 'string') {
      relPath = entry;
      outFile = path.basename(relPath).replace(/\.ts$/, '.js');
    } else {
      relPath = entry.src;
      outFile = entry.outName || path.basename(relPath).replace(/\.ts$/, '.js');
    }
    const src = path.join(srcDir, relPath);
    const out = path.join(outDir, outFile);
    await esbuild.build({
      entryPoints: [src],
      bundle: true,
      platform: 'browser',
      format: 'iife',
      outfile: out,
      logLevel: 'info'
    });
    console.log(`Bundled: ${src} -> ${out}`);
  })
).catch((err) => {
  console.error(err);
  process.exit(1);
});