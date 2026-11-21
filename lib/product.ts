// Trang chi tiết sản phẩm (viết lại từ woocommerce/single-product.php của theme IRIS).
import type { Category } from '@prisma/client';
import { testimonials } from './blog';
import { db } from './db';
import { autop, esc } from './html';
import { ic } from './icons';
import { breadcrumbs, sectionTitle } from './layout';
import { mod, type Settings, tel, zaloUrl } from './settings';
import { active, attrLabel, catUrl, FULL, type FullProduct, gallery, getAttributes, getCategories, money, pattrs, priceHtml, productCard, salePercent, termName, vattrs } from './shop';

const lines = (v: string) => v.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

function varPrice(regular: number | null, sale: number | null): string {
  const p = active(regular, sale);
  if (p === null) return '<span class="text-neutral-500">Liên hệ</span>';
  return p !== regular && regular ? `<del aria-hidden="true">${money(regular)}</del> <ins>${money(p)}</ins>` : money(p);
}

async function cartForm(p: FullProduct): Promise<string> {
  const qty = `<div class="quantity"><label class="sr-only" for="qty-${p.id}">Số lượng</label><input type="number" id="qty-${p.id}" class="input-text qty text" name="quantity" value="1" min="1" max="99" step="1" inputmode="numeric"></div>`;
  const buttons = `<button type="submit" class="single_add_to_cart_button button alt">Thêm vào giỏ hàng</button><button type="submit" name="buy_now" value="1" class="btn-buy-now single_add_to_cart_button">${ic('credit-card', 'size-5')} Mua ngay</button>`;
  if (p.type !== 'variable') {
    if (p.stock !== 'instock') return '<p class="stock out-of-stock text-lg font-bold text-red-700">Hết hàng – liên hệ để đặt trước</p>';
    if (active(p.regularPrice, p.salePrice) === null) return '';
    return `<form class="cart" action="/gio-hang/them/" method="post"><input type="hidden" name="product" value="${p.id}">${qty}${buttons}</form>`;
  }
  const attrs = await getAttributes();
  const used: Record<string, string[]> = {};
  for (const v of p.variations) for (const [k, s] of Object.entries(vattrs(v))) if (s) (used[k] ||= []).includes(s) || used[k].push(s);
  // Giữ thứ tự giá trị như trong sản phẩm.
  const own = pattrs(p);
  for (const k of Object.keys(used)) if (own[k]) used[k].sort((a, b) => own[k].indexOf(a) - own[k].indexOf(b));
  const data = p.variations.map((v) => ({
    variation_id: v.id,
    attributes: Object.fromEntries(Object.entries(vattrs(v)).map(([k, s]) => ['attribute_' + k, s])),
    image: v.image ? { src: v.image, full_src: v.image, thumb_src: v.image } : null,
    price_html: varPrice(v.regularPrice, v.salePrice),
    is_in_stock: v.stock === 'instock' && active(v.regularPrice, v.salePrice) !== null,
  }));
  let out = `<form class="variations_form cart" action="/gio-hang/them/" method="post" data-product_variations="${esc(JSON.stringify(data))}"><table class="variations" role="presentation"><tbody>`;
  for (const [k, slugs] of Object.entries(used)) {
    out += `<tr><th class="label"><label for="${esc(k)}">${esc(attrLabel(attrs, k))}</label></th><td class="value"><select id="${esc(k)}" name="attribute_${esc(k)}"><option value="">Chọn một tùy chọn</option>${slugs.map((s) => `<option value="${esc(s)}">${esc(termName(attrs, k, s))}</option>`).join('')}</select></td></tr>`;
  }
  out += `</tbody></table><div class="single_variation_wrap"><div class="woocommerce-variation single_variation"><div class="woocommerce-variation-price"></div></div><div class="woocommerce-variation-add-to-cart variations_button">${qty}${buttons}<input type="hidden" name="product" value="${p.id}"><input type="hidden" name="variation_id" value=""></div></div></form>`;
  return out;
}

async function specsTable(p: FullProduct): Promise<string> {
  const attrs = await getAttributes();
  const rows: [string, string][] = Object.entries(pattrs(p)).filter(([, v]) => v.length).map(([k, v]) => [attrLabel(attrs, k), v.map((s) => termName(attrs, k, s)).join(', ')]);
  for (const l of lines(p.specs)) {
    const i = l.indexOf(':');
    rows.push(i > 0 ? [l.slice(0, i).trim(), l.slice(i + 1).trim()] : [l, '']);
  }
  if (!rows.length) return '';
  return `<table class="woocommerce-product-attributes shop_attributes" aria-label="Thông số sản phẩm">${rows.map(([a, b]) => `<tr class="woocommerce-product-attributes-item"><th class="woocommerce-product-attributes-item__label" scope="row">${esc(a)}</th><td class="woocommerce-product-attributes-item__value"><p>${esc(b)}</p></td></tr>`).join('')}</table>`;
}

export async function productHtml(p: FullProduct, s: Settings, notice = ''): Promise<string> {
  const all = await getCategories();
  const images = [p.image, ...gallery(p)].filter(Boolean);
  const percent = salePercent(p);
  // Breadcrumb: danh mục sâu nhất của sản phẩm.
  const cats = p.categories.map((c) => c.category);
  const depth = (c: Category) => { let d = 0; for (let x: Category | undefined = c; x?.parentId; x = all.find((y) => y.id === x!.parentId)) d++; return d; };
  const main = cats.filter((c) => c.slug !== 'chua-phan-loai').sort((a, b) => depth(b) - depth(a))[0] || cats[0];
  const trail: [string, string?][] = [];
  if (main) {
    const chain: Category[] = [];
    for (let c: Category | undefined = main; c; c = all.find((x) => x.id === c!.parentId)) chain.unshift(c);
    chain.forEach((c) => trail.push([c.name, catUrl(c)]));
  }
  trail.push([p.name]);

  let out = `<div class="product-top"><div class="container-x pt-5 pb-10 lg:pt-6 lg:pb-[70px]">${breadcrumbs(trail, 'mb-5 text-[17px]')}${notice}
<div id="product-${p.id}" class="product type-product grid gap-8 lg:grid-cols-[630px_1fr] lg:gap-[30px]">
<div class="product-gallery" data-gallery><div class="product-gallery__thumbs no-scrollbar">${images
    .map((src, i) => `<button type="button" class="product-gallery__thumb ${i === 0 ? 'is-active' : ''}" data-thumb="${esc(src)}" data-full="${esc(src)}" aria-label="Ảnh ${i + 1}"><img src="${esc(src)}" class="size-full object-contain" alt="" loading="lazy" decoding="async"></button>`)
    .join('')}</div>
<div class="product-gallery__main">${images[0] ? `<img src="${esc(images[0])}" class="size-full object-contain" alt="${esc(p.name)}" loading="eager" fetchpriority="high" data-main="1">` : '<img src="/uploads/woocommerce-placeholder.webp" class="size-full object-contain" alt="">'}${percent ? `<span class="product-gallery__badge">-${percent}%</span>` : ''}<button type="button" class="product-gallery__zoom" data-zoom aria-label="Phóng to ảnh">${ic('maximize-2', 'size-4')}</button></div></div>
<div class="product-summary min-w-0"><h1 class="text-[28px] leading-tight font-bold text-gold lg:text-[34px]">${esc(p.name)}</h1><div class="product-summary__price mt-3">${priceHtml(p)}</div>`;
  if (p.short) out += `<div class="mt-4 rounded-[10px] border border-neutral-200 bg-white p-5 text-[17px]"><p class="mb-1 font-bold text-neutral-500">Mô tả ngắn:</p><div class="entry-content entry-content--tight">${autop(p.short)}</div></div>`;
  out += `<div class="product-cart mt-5">${await cartForm(p)}</div>`;
  out += `<a href="${esc(zaloUrl(s))}" target="_blank" rel="noopener" class="btn-gold mt-4 flex w-full justify-center py-2.5 text-[17px]">${esc(mod(s, 'support_button'))}</a>`;
  const promos = lines(mod(s, 'promo_items'));
  if (promos.length) out += `<div class="relative mt-12 rounded-[4px] border-2 border-dashed border-ink px-6 pt-8 pb-5"><p class="absolute -top-4 left-7 flex items-center gap-2 bg-[#f7f7f7] px-2 text-lg font-bold uppercase text-ink"><span class="flex size-9 items-center justify-center rounded-md bg-white text-gold shadow">${ic('gift', 'size-5')}</span>${esc(mod(s, 'promo_title'))}</p><ul class="list-disc space-y-2 pl-6 text-[17px]">${promos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`;
  out += `<div class="mt-5 rounded-[4px] border-2 border-ink px-7 py-4 text-[17px]"><p>Đặt mua: <a href="${esc(tel(mod(s, 'hotline')))}" class="font-bold text-gold">${esc(mod(s, 'hotline'))}</a> - ${esc(mod(s, 'hours'))}</p><p>Showroom: ${esc(mod(s, 'showroom'))}</p></div>`;
  const policies = lines(mod(s, 'policy_items'));
  if (policies.length) out += `<div class="mt-6 border-t border-neutral-200 pt-6"><p class="text-2xl font-bold text-neutral-500">${esc(mod(s, 'policy_title'))}</p><ul class="mt-4 flex flex-wrap gap-x-9 gap-y-3 text-sm text-neutral-700">${policies.map((x, i) => `<li class="flex items-center gap-2"><span class="flex size-6 items-center justify-center rounded-full border border-orange text-orange">${ic(['repeat-2', 'shield-check', 'truck'][i % 3], 'size-3.5')}</span>${esc(x)}</li>`).join('')}</ul></div>`;
  out += '</div></div></div></div>';

  // Tab: Câu chuyện sản phẩm / Thông số kỹ thuật.
  const tabs: [string, string, string][] = [];
  if (p.content.trim()) tabs.push(['description', 'Câu chuyện sản phẩm', autop(p.content)]);
  const specs = await specsTable(p);
  if (specs) tabs.push(['additional_information', 'Thông số kỹ thuật', specs]);
  if (tabs.length) {
    out += `<div class="container-x pt-[30px]"><div class="product-tabs" data-tabs><div class="product-tabs__nav no-scrollbar" role="tablist">${tabs.map(([k, t], i) => `<button type="button" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i === 0}" data-tab>${esc(t)}</button>`).join('')}</div>${tabs.map(([k, , body], i) => `<div class="product-tabs__panel entry-content" role="tabpanel" id="panel-${k}" aria-labelledby="tab-${k}"${i === 0 ? '' : ' hidden'}>${body}</div>`).join('')}</div></div>`;
  }
  out += `<div class="pt-10">${await testimonials('Khách hàng đánh giá', mod(s, 'site_name'))}</div>`;

  // Sản phẩm tương tự: cùng danh mục.
  const catIds = cats.map((c) => c.id);
  const related = catIds.length ? await db.product.findMany({ where: { status: 'publish', id: { not: p.id }, categories: { some: { categoryId: { in: catIds } } } }, include: FULL, take: 4, orderBy: { createdAt: 'desc' } }) : [];
  if (related.length) {
    const attrs = await getAttributes();
    out += `<section class="container-x pb-14">${sectionTitle(mod(s, 'related_title'), 'h2', 'mb-8 uppercase')}<div class="product-grid">${related.map((r) => productCard(r, attrs, true)).join('')}</div></section>`;
  }
  return out;
}
