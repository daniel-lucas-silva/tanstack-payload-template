import tailwind from 'bun-plugin-tailwind';
import { rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { injectManifest } from 'workbox-build';

const outdir = path.join(process.cwd(), 'dist');
await rm(outdir, { recursive: true, force: true });

console.log('📦 Building server and client application...');

// 1. Build the main server & app bundle
const result = await Bun.build({
  entrypoints: ['./index.ts'],
  outdir,
  plugins: [tailwind],
  minify: true,
  compile: false,
  splitting: false,
  bytecode: false,
  target: 'bun',
  format: 'esm',
  packages: 'external',
  sourcemap: 'none',
  env: 'inline',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});

for (const output of result.outputs) {
  console.log(
    ` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`,
  );
}

// 2. Build Service Worker as standalone browser bundle
console.log('⚙️ Bundling Service Worker (app/sw.ts)...');
const swResult = await Bun.build({
  entrypoints: ['./app/sw.ts'],
  outdir,
  target: 'browser',
  minify: true,
  sourcemap: 'none',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});

for (const output of swResult.outputs) {
  console.log(
    ` ${path.relative(process.cwd(), output.path)}  ${(output.size / 1024).toFixed(1)} KB`,
  );
}

// 3. Copy public directory assets into dist/public for standalone serving
try {
  await cp(path.join(process.cwd(), 'public'), path.join(outdir, 'public'), { recursive: true });
} catch (err) {
  console.warn('Could not copy public/ to dist/public:', err);
}

// 4. Inject precache manifest into dist/sw.js using workbox-build
console.log('⚡ Injecting precache manifest into dist/sw.js...');
try {
  const swDest = path.join(outdir, 'sw.js');
  await injectManifest({
    swSrc: swDest,
    swDest: swDest,
    globDirectory: outdir,
    globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,ico}'],
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
  });
  console.log('✓ Precache manifest successfully injected into dist/sw.js');
} catch (err) {
  console.warn('⚠️ Warning: injectManifest step encountered an issue:', err);
}
