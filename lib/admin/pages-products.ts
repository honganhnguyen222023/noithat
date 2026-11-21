// Quản trị: Sản phẩm (có mẫu màu / chất liệu), Danh mục, Thuộc tính.
import type { Category, Prisma, Variation } from '@prisma/client';
import { db } from '../db';
import { esc } from '../html';
import { catCounts, catUrl, FULL, gallery, getAttributes, getCategories, pattrs, priceHtml, productUrl, vattrs, type AttrFull } from '../shop';
import { actionButton, badge, card, type AdminPage, empty, field, formFields, pager, qi, qtUrl } from './ui';

type Q = Record<string, string>;

/** Danh mục dạng cây: [danh mục, cấp]. */
export function catTree(all: Category[], parent: number | null = null, depth = 0): [Category, number][] {
  return all.filter((c) => c.parentId === parent).flatMap((c) => [[c, depth] as [Category, number], ...catTree(all, c.id, depth + 1)]);
}

/* ============================================================ Sản phẩm */

export async function pageProducts(id: string, q: Q): Promise<AdminPage> {
  if (id === 'moi') return productEdit(0);
  if (id) return productEdit(parseInt(id, 10));
  const search = (q.q || '').trim();
  const cat = parseInt(q.dm, 10) || 0;
  const page = Math.max(1, parseInt(q.trang, 10) || 1);
  const all = await getCategories();
  const where: Prisma.ProductWhereInput = {};
  if (search) where.OR = [{ name: { contains: search } }, { sku: { contains: search } }];
  if (cat) where.categories = { some: { categoryId: cat } };
  const [total, list] = await Promise.all([db.product.count({ where }), db.product.findMany({ where, include: FULL, orderBy: [{ createdAt: 'desc' }], skip: (page - 1) * 30, take: 30 })]);
  const add = `<a class="qt-btn qt-btn-sm" href="${qtUrl('san-pham', 'moi')}">${qi('plus', 16)} <span>Thêm sản phẩm</span></a>`;
  let html = `<div class="qt-toolbar"><form class="qt-search" method="get" action="${qtUrl('san-pham')}" style="gap:8px">${qi('search', 16)}<input type="search" name="q" value="${esc(search)}" placeholder="Tên sản phẩm…" aria-label="Tìm sản phẩm"><select name="dm" onchange="this.form.submit()" aria-label="Lọc theo danh mục" style="border:0;background:none;max-width:180px"><option value="">Mọi danh mục</option>${catTree(all).map(([c, d]) => `<option value="${c.id}"${c.id === cat ? ' selected' : ''}>${'— '.repeat(d)}${esc(c.name)}</option>`).join('')}</select></form><p class="qt-muted">${total} sản phẩm</p></div>`;
  if (!list.length) return { title: 'Sản phẩm', actions: add, html: html + card('', empty('Chưa có sản phẩm nào.', 'package', add)) };
  const rows = list.map((p) => {
    const url = qtUrl('san-pham', p.id);
    return `<tr data-href="${url}"><td data-label="Sản phẩm"><div class="qt-person">${p.image ? `<img class="qt-thumb-sm" src="${esc(p.image)}" alt="">` : `<span class="qt-thumb-sm"></span>`}<div><a href="${url}"><strong>${esc(p.name)}</strong></a><span class="qt-muted qt-block">${p.type === 'variable' ? `${p.variations.length} mẫu` : 'Sản phẩm đơn'}${p.sku ? ' · ' + esc(p.sku) : ''}</span></div></div></td><td data-label="Giá" class="qt-price-cell">${priceHtml(p)}</td><td data-label="Danh mục">${esc(p.categories.map((c) => c.category.name).join(', ') || '—')}</td><td data-label="Trạng thái">${p.status === 'publish' ? badge('Đang bán', 'ok') : badge('Đang ẩn', 'mute')}${p.type !== 'variable' && p.stock !== 'instock' ? ' ' + badge('Hết hàng', 'bad') : ''}</td><td class="qt-row-actions"><a class="qt-btn qt-btn-ghost qt-btn-sm" href="${productUrl(p)}" target="_blank" rel="noopener" title="Xem trên website">${qi('eye', 15)}</a>${actionButton('product_delete', { product_id: p.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa sản phẩm “${p.name}”? Không khôi phục được (đơn hàng cũ vẫn giữ tên sản phẩm).`)}</td></tr>`;
  });
  html += card('', `<table class="qt-table is-click"><thead><tr><th>Sản phẩm</th><th>Giá</th><th>Danh mục</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>` + pager(page, Math.ceil(total / 30), qtUrl('san-pham', '', { ...(search ? { q: search } : {}), ...(cat ? { dm: cat } : {}) })), '', 'is-flush');
  return { title: 'Sản phẩm', actions: add, html };
}

/** 1 dòng mẫu sản phẩm (key = mã mẫu hoặc "__N__" cho dòng mới). */
function variationRow(key: string, attrs: AttrFull[], used: string[], v?: Variation): string {
  const va = v ? vattrs(v) : {};
  const sel = used.map((k) => {
    const a = attrs.find((x) => x.key === k);
    if (!a) return '';
    return `<div class="qt-field"><label>${esc(a.label)}</label><select name="v_${key}_${esc(k)}"><option value="">— Bất kỳ —</option>${a.terms.map((t) => `<option value="${esc(t.slug)}"${va[k] === t.slug ? ' selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>`;
  }).join('');
  return `<div class="qt-var"><input type="hidden" name="v_keys" value="${key}">${field(`v_${key}_image`, 'Ảnh', v?.image || '', { type: 'image' })}<div class="qt-var-fields">${sel}${field(`v_${key}_regular`, 'Giá gốc', v?.regularPrice ?? '', { type: 'money' })}${field(`v_${key}_sale`, 'Giá khuyến mãi', v?.salePrice ?? '', { type: 'money' })}${field(`v_${key}_sku`, 'Mã (SKU)', v?.sku || '')}${field(`v_${key}_stock`, 'Kho', v?.stock || 'instock', { type: 'select', options: { instock: 'Còn hàng', outofstock: 'Hết hàng' } })}</div><button type="button" class="qt-btn qt-btn-ghost qt-btn-sm is-danger" data-qt-var-del aria-label="Bỏ mẫu này">${qi('trash-2', 15)}</button></div>`;
}

async function productEdit(id: number): Promise<AdminPage> {
  const p = id ? await db.product.findUnique({ where: { id }, include: FULL }) : null;
  if (id && !p) return { title: 'Không tìm thấy', back: qtUrl('san-pham'), html: empty('Sản phẩm không tồn tại.', 'package'), status: 404 };
  const [all, attrs] = await Promise.all([getCategories(), getAttributes()]);
  const own = p ? pattrs(p) : {};
  const mine = new Set(p?.categories.map((c) => c.categoryId) || []);
  const type = p?.type || 'simple';

  let main = field('name', 'Tên sản phẩm', p?.name || '', { required: true, placeholder: 'VD: Sofa da Calmo 3 chỗ' });
  main += field('short', 'Mô tả ngắn (hiện cạnh ảnh)', p?.short || '', { type: 'editor' });
  main += field('content', 'Câu chuyện sản phẩm (mô tả chi tiết)', p?.content || '', { type: 'editor' });
  main += field('specs', 'Thông số kỹ thuật (mỗi dòng "Tên: giá trị")', p?.specs || '', { type: 'textarea', placeholder: 'Kích thước: 220 x 95 x 80 cm\nChất liệu khung: Gỗ sồi\nXuất xứ: Ý' });
  let pricing = field('type', 'Kiểu sản phẩm', type, { type: 'select', options: { simple: 'Sản phẩm đơn (1 giá)', variable: 'Có nhiều mẫu (màu sắc / chất liệu, mỗi mẫu 1 giá)' }, attrs: 'data-qt-ptype' });
  pricing += `<div data-show-type="simple"><div class="qt-form-grid">${field('regular_price', 'Giá gốc', p?.regularPrice ?? '', { type: 'money' })}${field('sale_price', 'Giá khuyến mãi (để trống nếu không giảm)', p?.salePrice ?? '', { type: 'money' })}${field('sku', 'Mã sản phẩm (SKU)', p?.sku || '')}${field('stock', 'Kho', p?.stock || 'instock', { type: 'select', options: { instock: 'Còn hàng', outofstock: 'Hết hàng' } })}</div></div>`;
  // Thuộc tính của sản phẩm (dùng để lọc + tạo mẫu).
  const attrBox = attrs.map((a) => `<div class="qt-field"><label>${esc(a.label)}</label><div class="qt-checks is-compact">${a.terms.map((t) => `<label class="qt-check"><input type="checkbox" name="attr_${esc(a.key)}" value="${esc(t.slug)}"${(own[a.key] || []).includes(t.slug) ? ' checked' : ''}><span>${esc(t.name)}</span></label>`).join('')}</div></div>`).join('');
  const used = attrs.map((a) => a.key);
  const vrows = (p?.variations || []).map((v) => variationRow(String(v.id), attrs, used, v)).join('');
  const vars = `<div data-show-type="variable"><p class="qt-help">Mỗi mẫu là 1 lựa chọn khách bấm chọn trên trang sản phẩm (vd màu Nâu, màu Trắng), có giá và ảnh riêng. Chọn "Bất kỳ" nếu mẫu không phân biệt theo thuộc tính đó.</p><div data-qt-var-list>${vrows}</div><button type="button" class="qt-btn qt-btn-ghost qt-btn-sm" data-qt-var-add style="margin-top:10px">${qi('plus', 16)} Thêm mẫu</button><template id="qt-var-tpl">${variationRow('__N__', attrs, used)}</template></div>`;

  let side = card('Hiển thị', field('publish', 'Đang bán (hiện trên website)', p ? p.status === 'publish' : true, { type: 'checkbox' }) + field('featured', 'Sản phẩm nổi bật', !!p?.featured, { type: 'checkbox' }) + field('slug', 'Đường dẫn (để trống = tự tạo từ tên)', p?.slug || '', { help: p ? `Link: ${productUrl(p)}` : '' }) + field('sort', 'Thứ tự (số nhỏ đứng trước)', p?.sortOrder ?? 0, { type: 'number' }));
  side += card('Ảnh', field('image', 'Ảnh chính', p?.image || '', { type: 'image' }) + field('gallery', 'Ảnh khác (di chuột vào ảnh sản phẩm sẽ hiện ảnh đầu tiên)', p ? gallery(p) : [], { type: 'gallery' }));
  side += card('Danh mục', `<div class="qt-checks is-compact">${catTree(all).map(([c, d]) => `<label class="qt-check" style="padding-left:${d * 18 + 8}px"><input type="checkbox" name="cats" value="${c.id}"${mine.has(c.id) ? ' checked' : ''}><span>${esc(c.name)}</span></label>`).join('')}</div>`);
  side += card('Màu sắc, chất liệu', attrBox || empty('Chưa có thuộc tính.', 'palette') + `<p class="qt-help">Dùng cho bộ lọc ở trang danh mục và chọn mẫu.</p>`);

  let form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" data-qt-dirty>${formFields('product_save')}<input type="hidden" name="product_id" value="${id}">`;
  form += `<div class="qt-grid is-wide-left"><div class="qt-stack">${card('Thông tin sản phẩm', main)}${card('Giá & mẫu', pricing + vars)}</div><div class="qt-stack">${side}</div></div>`;
  form += `<div class="qt-savebar"><span class="qt-muted" data-qt-dirty-note>Chưa có thay đổi</span><button class="qt-btn" type="submit">${qi('save', 18)} ${id ? 'Lưu sản phẩm' : 'Tạo sản phẩm'}</button></div></form>`;
  if (p) form += `<div class="qt-danger-zone">${actionButton('product_delete', { product_id: id }, qi('trash-2', 15) + ' Xóa sản phẩm', 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa sản phẩm “${p.name}”? Không khôi phục được.`)}</div>`;
  return { title: p ? p.name : 'Thêm sản phẩm', back: qtUrl('san-pham'), html: form, actions: p ? `<a class="qt-btn qt-btn-ghost qt-btn-sm" href="${productUrl(p)}" target="_blank" rel="noopener">${qi('eye', 16)} <span>Xem trên website</span></a>` : '' };
}

/* ============================================================ Danh mục */

export async function pageCategories(id: string): Promise<AdminPage> {
  if (id === 'moi') return categoryEdit(0);
  if (id) return categoryEdit(parseInt(id, 10));
  const [all, counts] = await Promise.all([getCategories(), catCounts()]);
  const add = `<a class="qt-btn qt-btn-sm" href="${qtUrl('danh-muc', 'moi')}">${qi('plus', 16)} <span>Thêm danh mục</span></a>`;
  const rows = catTree(all).map(([c, d]) => {
    const url = qtUrl('danh-muc', c.id);
    return `<tr data-href="${url}"><td data-label="Danh mục"><div class="qt-person" style="padding-left:${d * 26}px">${c.image ? `<img class="qt-thumb-sm" src="${esc(c.image)}" alt="">` : '<span class="qt-thumb-sm"></span>'}<div><a href="${url}"><strong>${d ? '— ' : ''}${esc(c.name)}</strong></a><span class="qt-muted qt-block">${catUrl(c)}</span></div></div></td><td data-label="Sản phẩm">${counts[c.id] || 0}</td><td data-label="Thứ tự">${c.sortOrder}</td><td class="qt-row-actions">${actionButton('category_delete', { category_id: c.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa danh mục “${c.name}”? Sản phẩm trong danh mục vẫn còn (chỉ bỏ khỏi danh mục này); danh mục con chuyển lên cấp trên.`)}</td></tr>`;
  });
  return { title: 'Danh mục sản phẩm', actions: add, html: card('', `<table class="qt-table is-click"><thead><tr><th>Danh mục</th><th>Sản phẩm</th><th>Thứ tự</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`, '', 'is-flush') + '<p class="qt-help" style="margin-top:12px">Danh mục cấp 1 có ảnh sẽ hiện ở khối "Danh mục" trang chủ (trừ các danh mục chọn làm Không gian). Thứ tự: số nhỏ đứng trước.</p>' };
}

async function categoryEdit(id: number): Promise<AdminPage> {
  const c = id ? await db.category.findUnique({ where: { id } }) : null;
  if (id && !c) return { title: 'Không tìm thấy', back: qtUrl('danh-muc'), html: empty('Danh mục không tồn tại.', 'folder'), status: 404 };
  const all = await getCategories();
  const parents: Record<string, string> = { '': '— Không (danh mục cấp 1) —' };
  for (const [x, d] of catTree(all)) if (x.id !== id) parents[String(x.id)] = '— '.repeat(d) + x.name;
  let main = field('name', 'Tên danh mục', c?.name || '', { required: true }) + `<div class="qt-form-grid">${field('slug', 'Đường dẫn (để trống = tự tạo)', c?.slug || '')}${field('parent', 'Danh mục cha', c?.parentId ? String(c.parentId) : '', { type: 'select', options: parents })}${field('sort', 'Thứ tự', c?.sortOrder ?? 0, { type: 'number' })}</div>`;
  main += field('image', 'Ảnh đại diện (vòng tròn ở trang chủ, menu Sản phẩm)', c?.image || '', { type: 'image' });
  main += field('description', 'Mô tả (hiện cuối trang danh mục, có nút "Xem thêm")', c?.description || '', { type: 'editor' });
  const banner = field('banner_title', 'Banner – tiêu đề (để trống = không hiện banner)', c?.bannerTitle || '') + field('banner_text', 'Banner – mô tả', c?.bannerText || '', { type: 'textarea' }) + field('banner_image', 'Banner – ảnh', c?.bannerImage || '', { type: 'image' });
  let form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" data-qt-dirty>${formFields('category_save')}<input type="hidden" name="category_id" value="${id}"><div class="qt-grid is-wide-left"><div class="qt-stack">${card('Danh mục', main)}</div><div class="qt-stack">${card('Banner đầu trang danh mục', banner)}</div></div>`;
  form += `<div class="qt-savebar"><span class="qt-muted" data-qt-dirty-note>Chưa có thay đổi</span><button class="qt-btn" type="submit">${qi('save', 18)} ${id ? 'Lưu danh mục' : 'Tạo danh mục'}</button></div></form>`;
  if (c) form += `<div class="qt-danger-zone">${actionButton('category_delete', { category_id: id }, qi('trash-2', 15) + ' Xóa danh mục', 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa danh mục “${c.name}”?`)}</div>`;
  return { title: c ? c.name : 'Thêm danh mục', back: qtUrl('danh-muc'), html: form, actions: c ? `<a class="qt-btn qt-btn-ghost qt-btn-sm" href="${catUrl(c)}" target="_blank" rel="noopener">${qi('eye', 16)} <span>Xem trên website</span></a>` : '' };
}

/* ============================================================ Thuộc tính (Màu sắc, Chất liệu…) */

export async function pageAttributes(): Promise<AdminPage> {
  const attrs = await getAttributes();
  const products = await db.product.findMany({ select: { attrs: true } });
  const count = (k: string, s: string) => products.filter((p) => (JSON.parse(p.attrs || '{}')[k] || []).includes(s)).length;
  let html = '<p class="qt-help" style="margin-bottom:16px">Các giá trị ở đây dùng cho bộ lọc trang danh mục ("Lọc theo màu") và cho khách chọn mẫu ở trang sản phẩm.</p><div class="qt-grid">';
  for (const a of attrs) {
    const terms = a.terms.map((t) => `<li><form method="post" action="/quan-tri/xu-ly/" class="qt-inline" style="display:flex;gap:8px;align-items:center;flex:1">${formFields('term_save')}<input type="hidden" name="term_id" value="${t.id}"><input type="text" name="name" value="${esc(t.name)}" required aria-label="Tên" style="flex:1;min-width:0"><span class="qt-muted">${count(a.key, t.slug)} sp</span><button class="qt-btn qt-btn-ghost qt-btn-sm" type="submit" title="Lưu tên">${qi('save', 15)}</button></form>${actionButton('term_delete', { term_id: t.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa “${t.name}”? Sản phẩm đang dùng giá trị này sẽ bỏ chọn.`)}</li>`).join('');
    const addTerm = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" style="display:flex;gap:8px;margin-top:12px">${formFields('term_add')}<input type="hidden" name="attribute_id" value="${a.id}"><input type="text" name="name" required placeholder="Thêm ${esc(a.label.toLowerCase())} mới, vd: Xám" style="flex:1"><button class="qt-btn qt-btn-sm" type="submit">${qi('plus', 16)} Thêm</button></form>`;
    const opts = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" style="margin-top:14px">${formFields('attribute_save')}<input type="hidden" name="attribute_id" value="${a.id}">${field('label', 'Tên thuộc tính', a.label, { required: true })}${field('filter', 'Hiện ở bộ lọc trang danh mục', a.filter, { type: 'checkbox' })}<div class="qt-form-foot"><button class="qt-btn qt-btn-ghost qt-btn-sm" type="submit">${qi('save', 15)} Lưu</button>${actionButton('attribute_delete', { attribute_id: a.id }, qi('trash-2', 15) + ' Xóa thuộc tính', 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa thuộc tính “${a.label}” và mọi giá trị của nó?`)}</div></form>`;
    html += card(a.label, `<ul class="qt-list">${terms}</ul>${addTerm}<details style="margin-top:12px"><summary class="qt-muted" style="cursor:pointer">Đổi tên / xóa thuộc tính</summary>${opts}</details>`);
  }
  html += card('Thêm thuộc tính mới', `<form method="post" action="/quan-tri/xu-ly/" class="qt-form">${formFields('attribute_add')}${field('label', 'Tên thuộc tính', '', { required: true, placeholder: 'VD: Kích thước' })}<div class="qt-form-foot"><button class="qt-btn qt-btn-sm" type="submit">${qi('plus', 16)} Thêm thuộc tính</button></div></form>`);
  return { title: 'Màu sắc, chất liệu', html: html + '</div>' };
}
