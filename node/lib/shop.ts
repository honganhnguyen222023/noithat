// Cửa hàng: giá, thẻ sản phẩm, truy vấn sản phẩm (viết lại từ inc/woocommerce.php của theme IRIS).
import type { Attribute, AttrTerm, Category, Prisma, Product, Variation } from '@prisma/client';
import { cache } from 'react';
import { db } from './db';
import { esc, num } from './html';
import { ic } from './icons';

export type FullProduct = Product & { variations: Variation[]; categories: { category: Category }[] };
export const FULL = { variations: { orderBy: { sortOrder: 'asc' as const } }, categories: { include: { category: true } } } satisfies Prisma.ProductInclude;

export const productUrl = (p: Pick<Product, 'slug'>) => `/san-pham/${encodeURIComponent(p.slug)}/`;
export const catUrl = (c: Pick<Category, 'slug'>) => `/danh-muc-san-pham/${encodeURIComponent(c.slug)}/`;

export function json<T>(v: string | null | undefined, def: T): T {
  try {
    return v ? (JSON.parse(v) as T) : def;
  } catch {
    return def;
  }
}
export const gallery = (p: Pick<Product, 'gallery'>) => json<string[]>(p.gallery, []);
export const pattrs = (p: Pick<Product, 'attrs'>) => json<Record<string, string[]>>(p.attrs, {});
export const vattrs = (v: Pick<Variation, 'attrs'>) => json<Record<string, string>>(v.attrs, {});

/** Giá đang bán: giá khuyến mãi (nếu thấp hơn giá gốc) hoặc giá gốc. */
export function active(regular: number | null, sale: number | null): number | null {
  if (sale !== null && sale > 0 && (regular === null || sale < regular)) return sale;
  return regular;
}
const onSale = (regular: number | null, sale: number | null) => sale !== null && sale > 0 && regular !== null && sale < regular;

/** Các mức giá (sản phẩm có nhiều mẫu: lấy theo từng mẫu). */
export function prices(p: Product & { variations?: Variation[] }) {
  if (p.type === 'variable' && p.variations?.length) {
    const list = p.variations.map((v) => ({ regular: v.regularPrice, sale: v.salePrice, price: active(v.regularPrice, v.salePrice) })).filter((x) => x.price !== null);
    const all = list.map((x) => x.price as number);
    return { min: all.length ? Math.min(...all) : null, max: all.length ? Math.max(...all) : null, sale: list.some((x) => onSale(x.regular, x.sale)), list };
  }
  const price = active(p.regularPrice, p.salePrice);
  return { min: price, max: price, sale: onSale(p.regularPrice, p.salePrice), list: [{ regular: p.regularPrice, sale: p.salePrice, price }] };
}

/** "12.000.000₫" theo kiểu WooCommerce. */
export function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  return `<span class="woocommerce-Price-amount amount"><bdi>${num(n)}<span class="woocommerce-Price-currencySymbol">₫</span></bdi></span>`;
}
export const vnd = (n: number | null | undefined) => (n === null || n === undefined ? '' : num(n) + '₫');

/** Giá hiển thị (có gạch giá cũ khi khuyến mãi). */
export function priceHtml(p: Product & { variations?: Variation[] }): string {
  const pr = prices(p);
  if (pr.min === null) return '<span class="text-neutral-500">Liên hệ</span>';
  if (p.type === 'variable' && pr.min !== pr.max) return `${money(pr.min)} – ${money(pr.max)}`;
  const one = p.type === 'variable' ? p.variations!.find((v) => active(v.regularPrice, v.salePrice) === pr.min)! : p;
  if (onSale(one.regularPrice, one.salePrice)) return `<del aria-hidden="true">${money(one.regularPrice)}</del> <span class="sr-only">Giá gốc là: ${vnd(one.regularPrice)}.</span><ins aria-hidden="true">${money(one.salePrice)}</ins><span class="sr-only">Giá hiện tại là: ${vnd(one.salePrice)}.</span>`;
  return money(pr.min);
}

/** % giảm giá lớn nhất (nhãn "-20%"). */
export function salePercent(p: Product & { variations?: Variation[] }): number {
  let max = 0;
  for (const x of prices(p).list) if (onSale(x.regular, x.sale)) max = Math.max(max, Math.round(100 - ((x.sale as number) / (x.regular as number)) * 100));
  return max;
}

/* ---------------------------------------------------------------- Thuộc tính (Màu sắc, Chất liệu…) */

export type AttrFull = Attribute & { terms: AttrTerm[] };
export const getAttributes = cache(async (): Promise<AttrFull[]> => db.attribute.findMany({ include: { terms: { orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] } }, orderBy: { id: 'asc' } }));

export function termName(attrs: AttrFull[], key: string, slug: string): string {
  return attrs.find((a) => a.key === key)?.terms.find((t) => t.slug === slug)?.name || slug;
}
export function attrLabel(attrs: AttrFull[], key: string): string {
  return attrs.find((a) => a.key === key)?.label || key.replace(/^pa_/, '');
}

/** "Màu sắc: Nâu, Chất liệu: Gỗ" của 1 mẫu. */
export function variantLabel(attrs: AttrFull[], v: Pick<Variation, 'attrs'>, withLabel = true): string {
  return Object.entries(vattrs(v)).filter(([, s]) => s).map(([k, s]) => (withLabel ? `${attrLabel(attrs, k)}: ` : '') + termName(attrs, k, s)).join(', ');
}

/* ---------------------------------------------------------------- Thẻ sản phẩm */

export function productCard(p: FullProduct, attrs: AttrFull[], button = false): string {
  const g = gallery(p);
  const percent = salePercent(p);
  const link = productUrl(p);
  const swatches = p.type === 'variable' ? p.variations.filter((v) => v.image).slice(0, 5) : [];
  const simple = p.type !== 'variable' && p.stock === 'instock' && prices(p).min !== null;
  let out = `<article class="product-card group" data-reveal><a href="${link}" class="product-card__media" aria-label="${esc(p.name)}">`;
  if (p.image) out += `<img src="${esc(p.image)}" class="product-card__img" alt="${esc(p.name)}" loading="lazy" decoding="async">`;
  if (g[0]) out += `<img src="${esc(g[0])}" class="product-card__img product-card__img--alt" alt="" loading="lazy" decoding="async">`;
  if (percent) out += `<span class="badge-sale">-${percent}%</span>`;
  out += `</a><div class="product-card__body"><div class="product-card__swatches">`;
  for (const v of swatches) {
    const label = variantLabel(attrs, v, false);
    out += `<span class="swatch" title="${esc(label)}"><img src="${esc(v.image)}" alt="${esc(label)}" loading="lazy" decoding="async"></span>`;
  }
  out += `</div><h3 class="product-card__title"><a href="${link}">${esc(p.name)}</a></h3><div class="product-card__price">${priceHtml(p)}</div>`;
  if (button) {
    out += '<div class="flex-1 min-h-3"></div>';
    out += simple
      ? `<a href="/gio-hang/them/?sp=${p.id}" data-add-to-cart="${p.id}" class="btn-outline mt-auto w-full px-2 text-[13px] whitespace-nowrap sm:px-5 sm:text-[17px]" rel="nofollow" aria-label="${esc(`Thêm “${p.name}” vào giỏ`)}">${ic('shopping-cart', 'size-4')} Thêm vào giỏ hàng</a>`
      : `<a href="${link}" class="btn-outline mt-auto w-full px-2 text-[13px] whitespace-nowrap sm:px-5 sm:text-[17px]" aria-label="${esc('Chọn tùy chọn cho ' + p.name)}">${ic('shopping-cart', 'size-4')} Chọn mẫu</a>`;
  }
  return out + '</div></article>';
}

/* ---------------------------------------------------------------- Danh mục */

export const getCategories = cache(async () => db.category.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] }));

/** Mã danh mục + tất cả danh mục con cháu. */
export function withDescendants(all: Category[], id: number): number[] {
  const out = [id];
  for (let i = 0; i < out.length; i++) for (const c of all) if (c.parentId === out[i] && !out.includes(c.id)) out.push(c.id);
  return out;
}

/** Số sản phẩm đang bán trong mỗi danh mục (tính cả danh mục con). */
export const catCounts = cache(async (): Promise<Record<number, number>> => {
  const [all, links] = await Promise.all([getCategories(), db.productCategory.findMany({ where: { product: { status: 'publish' } } })]);
  const out: Record<number, number> = {};
  for (const c of all) {
    const ids = new Set(withDescendants(all, c.id));
    out[c.id] = new Set(links.filter((l) => ids.has(l.categoryId)).map((l) => l.productId)).size;
  }
  return out;
});

/** Sản phẩm mới nhất (khối trang chủ, "Tải thêm"). */
export async function latestProducts(catSlug: string, limit: number, page = 1): Promise<FullProduct[]> {
  const where: Prisma.ProductWhereInput = { status: 'publish' };
  if (catSlug) {
    const all = await getCategories();
    const c = all.find((x) => x.slug === catSlug);
    if (c) where.categories = { some: { categoryId: { in: withDescendants(all, c.id) } } };
  }
  return db.product.findMany({ where, include: FULL, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: limit, skip: (page - 1) * limit });
}
