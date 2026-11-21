// Tiện ích HTML: thoát ký tự, lọc thẻ cho phép (giống kh_rich của theme), giá tiền…

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };

/** Thoát ký tự HTML (dùng cho chữ và thuộc tính). */
export function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

const RICH_TAGS: Record<string, string[]> = {
  strong: [], b: [], em: [], i: [], br: [], code: [], s: [],
  mark: ['class', 'style'], a: ['href', 'target', 'rel'], span: ['class'],
};

/** Chỉ giữ vài thẻ định dạng an toàn (giống kh_rich trong theme WordPress). */
export function rich(html: unknown): string {
  return String(html ?? '').replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tag: string, attrs: string) => {
    const t = tag.toLowerCase();
    if (!(t in RICH_TAGS)) return '';
    if (full.startsWith('</')) return `</${t}>`;
    const keep: string[] = [];
    const re = /([a-zA-Z-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(attrs))) {
      const name = m[1].toLowerCase();
      const val = m[3] ?? m[4] ?? '';
      if (!RICH_TAGS[t].includes(name)) continue;
      if (name === 'href' && /^\s*javascript:/i.test(val)) continue;
      keep.push(`${name}="${esc(val.replace(/&quot;/g, '"'))}"`);
    }
    return `<${t}${keep.length ? ' ' + keep.join(' ') : ''}>`;
  });
}

/** Gộp class, bỏ giá trị rỗng. */
export function cx(...c: unknown[]): string {
  return c.filter(Boolean).join(' ');
}

/** Chỉ lấy chữ số: "0912 345 678" → "0912345678". */
export function digits(v: unknown): string {
  return String(v ?? '').replace(/\D+/g, '');
}

/** 490000 → "490.000đ" ('' nếu 0 / trống). */
export function price(amount: unknown): string {
  const n = Number(String(amount ?? '').replace(/[^\d.]/g, ''));
  if (!n || n <= 0) return '';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
}

/** Số có dấu chấm ngăn cách: 1234567 → "1.234.567". */
export function num(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function isExternal(url: string): boolean {
  return /^https?:\/\//i.test(url) && !url.startsWith(process.env.SITE_URL || 'http://localhost');
}

/** Thuộc tính link: href + mở tab mới nếu là link ngoài. */
export function linkAttrs(url: string): string {
  const u = String(url || '').trim();
  return `href="${esc(u)}"` + (isExternal(u) ? ' target="_blank" rel="noopener"' : '');
}

/** Mã video YouTube từ link. */
export function youtubeId(url: unknown): string {
  const m = String(url ?? '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
  return m ? m[1] : '';
}

/** Ngày kiểu Việt Nam: 20/11/2026. */
export function vnDate(d: Date | number | string | null | undefined, withTime = false): string {
  if (!d) return '—';
  const dt = new Date(d);
  const opts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' };
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit', hour12: false });
  return new Intl.DateTimeFormat('vi-VN', opts).format(dt).replace(',', '');
}

/** Bỏ thẻ HTML, lấy chữ. */
export function stripTags(html: unknown): string {
  return String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#8230;/g, '…').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/** Đoạn văn không có thẻ khối → bọc <p> (giống wpautop). */
export function autop(text: unknown): string {
  const s = String(text ?? '').trim();
  if (!s) return '';
  if (/<(p|div|h[1-6]|ul|ol|table|blockquote|figure)\b/i.test(s)) return s;
  return s.split(/\n\s*\n/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

/** "Bàn ăn Calmo" → "ban-an-calmo". */
export function slugify(v: unknown): string {
  return String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Rút gọn chữ: lấy n từ đầu. */
export function words(text: string, n: number): string {
  const w = stripTags(text).split(' ');
  return w.length > n ? w.slice(0, n).join(' ') + '…' : w.join(' ');
}
