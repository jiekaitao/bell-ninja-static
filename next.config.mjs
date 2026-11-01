import { existsSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const versionFile = new URL('./public/version.txt', import.meta.url);

/* Written by scripts/stamp-version.mjs on every build. Dev has no stamp, which
   turns the "reload open tabs" check off. */
const version = existsSync(versionFile) ? readFileSync(versionFile, 'utf8').trim() : '';

export default {
  /* GitHub Pages only serves files, so every page is prebuilt to out/. */
  output: 'export',
  /* /legends/ becomes legends/index.html, and /legends and /darkness keep
     working the way they always have. */
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BUILD_VERSION: version },
  turbopack: { root },
};
