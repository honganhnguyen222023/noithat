// Copies the Lucide icons the theme uses into iris/assets/icons (minified). Run via `npm run build`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const ICONS = ['search','menu','x','chevron-down','chevron-right','chevron-left','arrow-left','arrow-right','shopping-cart',
  'shopping-bag','map-pin','phone','phone-call','mail','play','minus','plus','maximize-2','credit-card','repeat-2',
  'shield-check','truck','message-circle','square-pen','clock','list-tree','sliders-horizontal','house','calendar',
  'quote','arrow-up','gift','store','circle-check','send','user','zoom-in','package-check'];
const out = new URL('../iris/assets/icons/', import.meta.url);
mkdirSync(out, { recursive: true });
for (const name of ICONS) {
  let svg = readFileSync(new URL(`../node_modules/lucide-static/icons/${name}.svg`, import.meta.url), 'utf8');
  svg = svg.replace(/<!--.*?-->/s, '').replace(/\s*class="[^"]*"/, '').replace(/\s*\n\s*/g, ' ').replace(/>\s+</g, '><').trim();
  writeFileSync(new URL(`${name}.svg`, out), svg);
}
console.log(`icons: ${ICONS.length}`);
