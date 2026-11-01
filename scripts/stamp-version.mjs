/* Every build gets a stamp. Open tabs poll /version.txt and reload when it
   changes (see components/UpdateWatcher.tsx). */
import { writeFileSync } from 'node:fs';

const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
writeFileSync(new URL('../public/version.txt', import.meta.url), stamp + '\n');
console.log('version ' + stamp);
