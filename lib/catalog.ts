// Trang cửa hàng + trang danh mục: banner, danh mục con, bộ lọc, sắp xếp, phân trang
// (viết lại từ woocommerce/archive-product.php + template-parts/shop-sidebar.php).
import type { Category, Prisma } from '@prisma/client';
import { db } from './db';
import { autop, esc } from './html';
import { ic } from './icons';
import { breadcrumbs } from './layout';
import { active, type AttrFull, catCounts, catUrl, FULL, type FullProduct, getAttributes, getCategories, productCard, withDescendants } from './shop';

export type Query = Record<string, string>;
const PER_PAGE = 12;

export const PRICE_RANGES: [number, number, string][] = [
  [0, 1000000, 'Dưới 1.000.000đ'],
  [1000000, 3000000, '1.000.000đ - 3.000.000đ'],
  [3000000, 5000000, '3.000.000đ - 5.000.000đ'],
  [5000000, 10000000, '5.000.000đ - 10.000.000đ'],
  [10000000, 0, 'Trên 10.000.000đ'],
];
const ORDERS: Record<string, string> = { menu_order: 'Thứ tự mặc định', date: 'Mới nhất', price: 'Giá: thấp đến cao', 'price-desc': 'Giá: cao xuống thấp', name: 'Tên A → Z' };

/** Link giữ các tham số hiện tại, đổi vài tham số (null = bỏ). */
function link(base: string, q: Query, change: Record<string, string | null>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...q, ...change })) if (v !== null && v !== '' && k !== 'trang') u.set(k, v);
  if (change.trang) u.set('trang', change.trang);
  const s = u.toString();
  return base + (s ? '?' + s : '');
}

function minPrice(p: FullProduct): number | null {
  if (p.type === 'variable') {
    const all = p.variations.map((v) => active(v.regularPrice, v.salePrice)).filter((x): x is number => x !== null);
    return all.length ? Math.min(...all) : null;
  }
  return active(p.regularPrice, p.salePrice);
}

/** Lọc + sắp xếp sản phẩm. */
async function findProducts(cat: Category | null, q: Query, attrs: AttrFull[]) {
  const all = await getCategories();
  const where: Prisma.ProductWhereInput = { status: 'publish' };
  if (cat) where.categories = { some: { categoryId: { in: withDescendants(all, cat.id) } } };
  if (q.s) where.OR = [{ name: { contains: q.s } }, { short: { contains: q.s } }, { sku: { contains: q.s } }];
  let list = await db.product.findMany({ where, include: FULL });
  // Lọc thuộc tính (?filter_mau-sac=nau,trang).
  for (const a of attrs) {
    const want = (q['filter_' + a.key.replace(/^pa_/, '')] || '').split(',').filter(Boolean);
    if (want.length) list = list.filter((p) => (JSON.parse(p.attrs || '{}')[a.key] || []).some((s: string) => want.includes(s)));
  }
  // Lọc giá.
  const lo = q.min_price ? parseInt(q.min_price, 10) : null;
  const hi = q.max_price ? parseInt(q.max_price, 10) : null;
  if (lo !== null || hi !== null) list = list.filter((p) => { const m = minPrice(p); return m !== null && (lo === null || m >= lo) && (hi === null || m <= hi); });
  // Sắp xếp.
  const by = q.orderby || 'menu_order';
  const val = (p: FullProduct) => minPrice(p) ?? Number.MAX_SAFE_INTEGER;
  list.sort((a, b) => {
    if (by === 'price') return val(a) - val(b);
    if (by === 'price-desc') return val(b) - val(a);
    if (by === 'name') return a.name.localeCompare(b.name, 'vi');
    if (by === 'date') return b.createdAt.getTime() - a.createdAt.getTime();
    return a.sortOrder - b.sortOrder || b.createdAt.getTime() - a.createdAt.getTime();
  });
  return list;
}

export function pagination(page: number, pages: number, href: (n: number) => string): string {
  if (pages < 2) return '';
  let out = '<nav class="woocommerce-pagination" aria-label="Phân trang"><ul class="page-numbers">';
  if (page > 1) out += `<li><a class="page-numbers prev" href="${esc(href(page - 1))}" aria-label="Trang trước">${ic('chevron-left', 'size-4')}</a></li>`;
  for (let n = 1; n <= pages; n++) {
    if (pages > 7 && n !== 1 && n !== pages && Math.abs(n - page) > 1) {
      if (n === 2 || n === pages - 1) out += '<li><span class="page-numbers dots">…</span></li>';
      continue;
    }
    out += n === page ? `<li><span aria-current="page" class="page-numbers current">${n}</span></li>` : `<li><a class="page-numbers" href="${esc(href(n))}">${n}</a></li>`;
  }
  if (page < pages) out += `<li><a class="page-numbers next" href="${esc(href(page + 1))}" aria-label="Trang sau">${ic('chevron-right', 'size-4')}</a></li>`;
  return out + '</ul></nav>';
}

async function sidebar(cat: Category | null, q: Query, base: string, attrs: AttrFull[]): Promise<string> {
  const [all, counts] = await Promise.all([getCategories(), catCounts()]);
  const top = all.filter((c) => !c.parentId && counts[c.id]).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  const cur = cat?.id || 0;
  let out = `<aside id="shop-filters" class="shop-sidebar" data-filter-panel aria-label="Bộ lọc sản phẩm"><div class="flex items-center justify-between border-b border-neutral-200 p-5 lg:hidden"><span class="text-lg font-bold">Bộ lọc</span><button type="button" data-filter-close aria-label="Đóng bộ lọc">${ic('x', 'size-6')}</button></div><div class="space-y-8 p-5 lg:p-0">`;
  out += '<section class="sidebar-box"><h3 class="sidebar-title">Danh mục sản phẩm</h3><ul class="space-y-3">';
  for (const c of top) {
    const kids = all.filter((k) => k.parentId === c.id && counts[k.id]);
    const open = !!cur && (cur === c.id || withDescendants(all, c.id).includes(cur));
    out += `<li><div class="flex items-center gap-2"><a href="${catUrl(c)}" class="flex-1 hover:text-gold ${cur === c.id ? 'font-bold text-ink' : ''}">${esc(c.name)}</a><span class="text-xs text-neutral-500">(${counts[c.id]})</span>`;
    if (kids.length) out += `<button type="button" class="p-1" data-acc aria-expanded="${open}" aria-label="Mở danh mục con">${ic('chevron-down', 'size-4 transition')}</button>`;
    out += '</div>';
    if (kids.length) out += `<ul class="mt-2 space-y-2 border-l border-neutral-200 pl-4 text-[15px]"${open ? '' : ' hidden'}>${kids.map((k) => `<li><a href="${catUrl(k)}" class="hover:text-gold ${cur === k.id ? 'font-bold' : ''}">${esc(k.name)}</a> <span class="text-xs text-neutral-500">(${counts[k.id]})</span></li>`).join('')}</ul>`;
    out += '</li>';
  }
  out += '</ul></section>';
  const check = (href: string, activeNow: boolean, label: string, extra = '') => `<li><a href="${esc(href)}" class="filter-check ${activeNow ? 'is-active' : ''}" rel="nofollow"><span class="filter-check__box">${ic('circle-check', 'size-3.5')}</span>${extra ? `<span class="flex-1">${esc(label)}</span>${extra}` : esc(label)}</a></li>`;
  out += '<section class="sidebar-box"><h3 class="sidebar-title">Lọc theo giá</h3><ul class="space-y-2.5">';
  const lo = q.min_price ? +q.min_price : null;
  const hi = q.max_price ? +q.max_price : null;
  for (const [a, b, label] of PRICE_RANGES) {
    const on = lo === a && (b ? hi === b : hi === null);
    out += check(on ? link(base, q, { min_price: null, max_price: null }) : link(base, q, { min_price: String(a), max_price: b ? String(b) : null }), on, label);
  }
  out += '</ul></section>';
  // Lọc theo thuộc tính (Màu sắc, Chất liệu).
  const products = await db.product.findMany({ where: { status: 'publish' }, select: { attrs: true } });
  for (const a of attrs.filter((x) => x.filter)) {
    const param = 'filter_' + a.key.replace(/^pa_/, '');
    const cur2 = (q[param] || '').split(',').filter(Boolean);
    const count = (slug: string) => products.filter((p) => (JSON.parse(p.attrs || '{}')[a.key] || []).includes(slug)).length;
    const terms = a.terms.filter((t) => count(t.slug));
    if (!terms.length) continue;
    out += `<section class="sidebar-box"><h3 class="sidebar-title">Lọc theo ${esc(a.label.toLowerCase())}</h3><ul class="space-y-2.5">`;
    for (const t of terms) {
      const on = cur2.includes(t.slug);
      const next = on ? cur2.filter((x) => x !== t.slug) : [...cur2, t.slug];
      out += check(link(base, q, { [param]: next.length ? next.join(',') : null }), on, t.name, `<span class="text-xs text-neutral-500">(${count(t.slug)})</span>`);
    }
    out += '</ul></section>';
  }
  return out + '</div></aside><div class="filter-backdrop" data-filter-close hidden></div>';
}

export async function catalogHtml(cat: Category | null, q: Query): Promise<string> {
  const attrs = await getAttributes();
  const all = await getCategories();
  const base = cat ? catUrl(cat) : '/cua-hang/';
  const title = cat ? cat.name : q.s ? `Tìm kiếm: “${q.s}”` : 'Sản phẩm';
  const trail: [string, string?][] = [];
  if (cat) {
    const chain: Category[] = [];
    for (let c: Category | undefined = cat; c; c = all.find((x) => x.id === c!.parentId)) chain.unshift(c);
    chain.forEach((c, i) => trail.push([c.name, i < chain.length - 1 ? catUrl(c) : undefined]));
  } else trail.push([q.s ? `Tìm kiếm: ${q.s}` : 'Sản phẩm']);

  const list = await findProducts(cat, q, attrs);
  const page = Math.max(1, parseInt(q.trang, 10) || 1);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const items = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const by = ORDERS[q.orderby] ? q.orderby : 'menu_order';
  const hidden = Object.entries(q).filter(([k, v]) => v && !['orderby', 'trang'].includes(k)).map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');

  let out = `<div class="bg-white"><div class="container-x flex flex-wrap items-center justify-between gap-4 py-4 lg:py-6">${breadcrumbs(trail, 'text-[17px]')}
<div class="flex w-full items-center gap-3 sm:w-auto [&_.woocommerce-ordering]:min-w-0 [&_.woocommerce-ordering]:flex-1"><button type="button" class="btn-outline h-10 shrink-0 px-4 text-base whitespace-nowrap lg:hidden" data-filter-open aria-controls="shop-filters">${ic('sliders-horizontal', 'size-4')} Bộ lọc</button>
<form class="woocommerce-ordering" method="get" action="${esc(base)}"><select name="orderby" class="orderby" aria-label="Sắp xếp" onchange="this.form.submit()">${Object.entries(ORDERS).map(([k, l]) => `<option value="${k}"${k === by ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>${hidden}</form></div></div></div>
<h1 class="sr-only">${esc(title)}</h1>`;

  if (cat?.bannerTitle) {
    out += `<section class="cat-banner border-y border-neutral-200 bg-white"><div class="grid lg:grid-cols-[47%_53%]"><div class="flex flex-col justify-center px-[15px] py-10 lg:py-16 lg:pr-12 lg:pl-[max(45px,calc((100vw-1320px)/2+15px))]" data-reveal="left"><h2 class="text-[32px] font-bold uppercase leading-tight text-ink lg:text-[45px]">${esc(cat.bannerTitle)}</h2><p class="mt-5 max-w-[460px] text-[17px] leading-[1.6]">${esc(cat.bannerText)}</p></div>
<div class="relative flex min-h-[300px] items-center bg-gold lg:min-h-[520px]">${cat.bannerImage ? `<img src="${esc(cat.bannerImage)}" class="relative z-10 w-[92%] max-w-[760px] lg:-ml-[10%]" alt="${esc(cat.bannerTitle)}" loading="eager">` : ''}</div></div></section>`;
  }
  const children = cat ? all.filter((c) => c.parentId === cat.id) : [];
  if (children.length) {
    out += `<section class="bg-white py-8 lg:py-[60px]"><div class="container-x"><div class="no-scrollbar flex snap-x gap-6 overflow-x-auto lg:gap-[42px]">${children
      .map((c) => `<a href="${catUrl(c)}" class="subcat group w-[130px] shrink-0 snap-start text-center lg:w-[190px]"><span class="subcat__img">${c.image ? `<img src="${esc(c.image)}" class="size-full object-cover transition duration-500 group-hover:scale-110" alt="" loading="lazy">` : '<img src="/uploads/woocommerce-placeholder.webp" class="size-full object-cover opacity-60" alt="" loading="lazy">'}</span><span class="mt-4 block text-sm uppercase lg:text-base">${esc(c.name)}</span></a>`)
      .join('')}</div></div></section>`;
  }
  out += `<div class="container-x grid gap-8 py-8 lg:grid-cols-[300px_1fr] lg:py-[30px]">${await sidebar(cat, q, base, attrs)}<div class="min-w-0">`;
  if (items.length) {
    out += `<div class="product-grid product-grid--3">${items.map((p) => productCard(p, attrs, true)).join('')}</div>`;
    out += `<div class="iris-pagination mt-10">${pagination(page, pages, (n) => link(base, q, { trang: n > 1 ? String(n) : null }))}</div>`;
  } else {
    out += `<div class="rounded-xl bg-white p-10 text-center"><p class="text-lg">Chưa có sản phẩm phù hợp.</p><a href="/cua-hang/" class="btn-gold mt-5">Xem tất cả sản phẩm</a></div>`;
  }
  if (cat?.description && page === 1) out += `<div class="readmore mt-6" data-readmore><div class="entry-content readmore__body" data-readmore-body>${autop(cat.description)}</div><button type="button" class="readmore__btn" data-readmore-btn aria-expanded="false">Xem thêm</button></div>`;
  return out + '</div></div>';
}
