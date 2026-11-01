/*
 * Serves out/ the way GitHub Pages does: gzip, folders redirect to a trailing
 * slash, `/page` finds page.html, and anything else gets 404.html.
 *
 *   npm run build && npm run preview
 */
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const OUT = fileURLToPath(new URL('../out', import.meta.url));
const PORT = Number(process.env.PORT || 3100);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.txt': 'text/plain', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
};

function send(res, status, file) {
  const type = TYPES[extname(file)] || 'application/octet-stream';
  if (/^(text|application\/json)/.test(type)) {
    const body = gzipSync(readFileSync(file));
    res.writeHead(status, { 'content-type': type, 'content-encoding': 'gzip', 'cache-control': 'no-store' });
    res.end(body);
  } else {
    res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  }
}

createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const path = join(OUT, normalize(pathname));

  if (existsSync(path) && statSync(path).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { location: pathname + '/' });
      res.end();
    } else if (existsSync(join(path, 'index.html'))) send(res, 200, join(path, 'index.html'));
    else send(res, 404, join(OUT, '404.html'));
  } else if (existsSync(path)) send(res, 200, path);
  else if (existsSync(path + '.html')) send(res, 200, path + '.html');
  else send(res, 404, join(OUT, '404.html'));
}).listen(PORT, '127.0.0.1', () => console.log('http://127.0.0.1:' + PORT));
