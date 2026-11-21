// Icon: bộ icon của theme IRIS (assets/icons/*.svg) cho website, bộ Lucide cho trang quản trị.
import iris from './iris-icons.json';
import lucide from './icons-data.json';

const IRIS = iris as Record<string, string>;
const LUCIDE = lucide as Record<string, string>;

/** Icon website (giống iris_icon): <svg class="…" aria-hidden="true">. */
export function ic(name: string, cls = 'size-5'): string {
  const svg = IRIS[name];
  if (svg) return svg.replace(/<svg\b/, `<svg class="${cls}" aria-hidden="true" focusable="false"`);
  const inner = LUCIDE[name];
  return inner ? `<svg class="${cls}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>` : '';
}

/** Icon trang quản trị (Lucide, inline SVG). */
export function icon(name: string, cls = '', size = 20): string {
  const inner = LUCIDE[name];
  if (!inner) return IRIS[name] ? IRIS[name].replace(/<svg\b/, `<svg class="${('kh-svg ' + cls).trim()}" width="${size}" height="${size}" aria-hidden="true" focusable="false"`) : '';
  return `<svg class="${('kh-svg ' + cls).trim()}" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${inner}</svg>`;
}
