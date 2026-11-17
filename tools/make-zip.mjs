// Builds dist/iris.zip – the file you upload in WordPress: Giao diện → Thêm mới → Tải giao diện lên.
import AdmZip from 'adm-zip';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../iris', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const zip = new AdmZip();
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else zip.addLocalFile(full, join('iris', relative(root, dir)));
  }
};
walk(root);
mkdirSync(new URL('../dist', import.meta.url), { recursive: true });
zip.writeZip(new URL('../dist/iris.zip', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
console.log('dist/iris.zip created');
