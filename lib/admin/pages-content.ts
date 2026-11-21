// Quản trị: Bài viết, Trang, Phản hồi khách hàng, Tin nhắn liên hệ, Nội dung website, Menu, Thanh toán & cài đặt, Tài khoản của tôi.
import type { MenuItem } from '../settings';
import type { User } from '@prisma/client';
import { postUrl } from '../blog';
import { db } from '../db';
import { esc, vnDate } from '../html';
import { FIELDS, getSettings, MENU_LOCATIONS, mod } from '../settings';
import { catUrl, getCategories } from '../shop';
import { catTree } from './pages-products';
import { actionButton, ago, badge, card, type AdminPage, empty, field, formFields, pager, phoneLinks, qi, qtUrl } from './ui';

type Q = Record<string, string>;

/* ============================================================ Bài viết blog */

export async function pagePosts(id: string, q: Q): Promise<AdminPage> {
  if (id === 'moi') return postEdit(0);
  if (id) return postEdit(parseInt(id, 10));
  const page = Math.max(1, parseInt(q.trang, 10) || 1);
  const search = (q.q || '').trim();
  const where = search ? { title: { contains: search } } : {};
  const [total, posts, cats] = await Promise.all([db.post.count({ where }), db.post.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20, include: { categories: { include: { category: true } } } }), db.blogCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { posts: true } } } })]);
  const add = `<a class="qt-btn qt-btn-sm" href="${qtUrl('bai-viet', 'moi')}">${qi('plus', 16)} <span>Viết bài mới</span></a>`;
  let html = `<div class="qt-toolbar"><form class="qt-search" method="get" action="${qtUrl('bai-viet')}">${qi('search', 16)}<input type="search" name="q" value="${esc(search)}" placeholder="Tìm bài viết…" aria-label="Tìm bài viết"></form><p class="qt-muted">${total} bài viết</p></div><div class="qt-grid is-wide-left"><div class="qt-stack">`;
  const rows = posts.map((p) => {
    const url = qtUrl('bai-viet', p.id);
    return `<tr data-href="${url}"><td data-label="Bài viết"><div class="qt-person">${p.image ? `<img class="qt-thumb-sm" src="${esc(p.image)}" alt="" style="object-fit:cover">` : '<span class="qt-thumb-sm"></span>'}<div><a href="${url}"><strong>${esc(p.title)}</strong></a><span class="qt-muted qt-block">${esc(p.categories.map((c) => c.category.name).join(', ') || 'Chưa có chuyên mục')}</span></div></div></td><td data-label="Ngày">${esc(vnDate(p.createdAt))}</td><td data-label="Trạng thái">${p.status === 'publish' ? badge('Đang hiện', 'ok') : badge('Bản nháp', 'mute')}</td><td class="qt-row-actions"><a class="qt-btn qt-btn-ghost qt-btn-sm" href="${postUrl(p)}" target="_blank" rel="noopener">${qi('eye', 15)}</a>${actionButton('post_delete', { post_id: p.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa bài “${p.title}”? Không khôi phục được.`)}</td></tr>`;
  });
  html += posts.length ? card('', `<table class="qt-table is-click"><thead><tr><th>Bài viết</th><th>Ngày</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>` + pager(page, Math.ceil(total / 20), qtUrl('bai-viet', '', search ? { q: search } : {})), '', 'is-flush') : card('', empty('Chưa có bài viết nào.', 'newspaper', add));
  html += '</div><div class="qt-stack">';
  const cl = cats.map((c) => `<li><form method="post" action="/quan-tri/xu-ly/" style="display:flex;gap:8px;align-items:center;flex:1">${formFields('blogcat_save')}<input type="hidden" name="cat_id" value="${c.id}"><input type="text" name="name" value="${esc(c.name)}" required style="flex:1;min-width:0" aria-label="Tên chuyên mục"><span class="qt-muted">${c._count.posts}</span><button class="qt-btn qt-btn-ghost qt-btn-sm" type="submit" title="Lưu">${qi('save', 15)}</button></form>${actionButton('blogcat_delete', { cat_id: c.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa chuyên mục “${c.name}”? Bài viết vẫn còn.`)}</li>`).join('');
  html += card('Chuyên mục blog', `<ul class="qt-list">${cl}</ul><form method="post" action="/quan-tri/xu-ly/" style="display:flex;gap:8px;margin-top:12px">${formFields('blogcat_save')}<input type="text" name="name" required placeholder="Chuyên mục mới" style="flex:1"><button class="qt-btn qt-btn-sm" type="submit">${qi('plus', 16)}</button></form>`);
  return { title: 'Bài viết blog', actions: add, html: html + '</div></div>' };
}

async function postEdit(id: number): Promise<AdminPage> {
  const p = id ? await db.post.findUnique({ where: { id }, include: { categories: true } }) : null;
  if (id && !p) return { title: 'Không tìm thấy', back: qtUrl('bai-viet'), html: empty('Bài viết không tồn tại.', 'newspaper'), status: 404 };
  const cats = await db.blogCategory.findMany({ orderBy: { name: 'asc' } });
  const mine = new Set(p?.categories.map((c) => c.categoryId) || []);
  const main = field('title', 'Tiêu đề', p?.title || '', { required: true }) + field('content', 'Nội dung (tiêu đề H2/H3 sẽ tự tạo mục lục)', p?.content || '', { type: 'editor' }) + field('excerpt', 'Tóm tắt (hiện ở thẻ bài viết; để trống = tự lấy đầu bài)', p?.excerpt || '', { type: 'textarea' });
  const date = p ? new Date(p.createdAt.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 16) : '';
  const side = card('Đăng bài', field('publish', 'Hiện trên website', p ? p.status === 'publish' : true, { type: 'checkbox' }) + field('date', 'Ngày đăng', date, { type: 'datetime-local', help: 'Để trống = bây giờ.' }) + field('slug', 'Đường dẫn (để trống = tự tạo)', p?.slug || '', { help: p ? `Link: ${postUrl(p)}` : '' })) + card('Ảnh đại diện', field('image', 'Ảnh', p?.image || '', { type: 'image' })) + card('Chuyên mục', `<div class="qt-checks is-compact">${cats.map((c) => `<label class="qt-check"><input type="checkbox" name="cats" value="${c.id}"${mine.has(c.id) ? ' checked' : ''}><span>${esc(c.name)}</span></label>`).join('')}</div>`);
  let form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" data-qt-dirty>${formFields('post_save')}<input type="hidden" name="post_id" value="${id}"><div class="qt-grid is-wide-left"><div class="qt-stack">${card('', main)}</div><div class="qt-stack">${side}</div></div>`;
  form += `<div class="qt-savebar"><span class="qt-muted" data-qt-dirty-note>Chưa có thay đổi</span><button class="qt-btn" type="submit">${qi('save', 18)} ${id ? 'Lưu bài viết' : 'Đăng bài'}</button></div></form>`;
  if (p) form += `<div class="qt-danger-zone">${actionButton('post_delete', { post_id: id }, qi('trash-2', 15) + ' Xóa bài viết', 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa bài “${p.title}”?`)}</div>`;
  return { title: p ? p.title : 'Viết bài mới', back: qtUrl('bai-viet'), html: form, actions: p ? `<a class="qt-btn qt-btn-ghost qt-btn-sm" href="${postUrl(p)}" target="_blank" rel="noopener">${qi('eye', 16)} <span>Xem</span></a>` : '' };
}

/* ============================================================ Trang */

const TEMPLATES: Record<string, string> = { '': 'Trang thường (chính sách, hướng dẫn…)', about: 'Trang Giới thiệu (nội dung ở "Nội dung website")', contact: 'Trang Liên hệ (có form, bản đồ)' };

export async function pagePages(id: string): Promise<AdminPage> {
  if (id === 'moi') return pageEdit(0);
  if (id) return pageEdit(parseInt(id, 10));
  const pages = await db.page.findMany({ orderBy: { title: 'asc' } });
  const add = `<a class="qt-btn qt-btn-sm" href="${qtUrl('trang', 'moi')}">${qi('plus', 16)} <span>Thêm trang</span></a>`;
  const rows = pages.map((p) => `<tr data-href="${qtUrl('trang', p.id)}"><td data-label="Trang"><a href="${qtUrl('trang', p.id)}"><strong>${esc(p.title)}</strong></a><span class="qt-muted qt-block">/${esc(p.slug)}/</span></td><td data-label="Kiểu">${esc(TEMPLATES[p.template] || '')}</td><td data-label="Trạng thái">${p.status === 'publish' ? badge('Đang hiện', 'ok') : badge('Ẩn', 'mute')}</td><td class="qt-row-actions"><a class="qt-btn qt-btn-ghost qt-btn-sm" href="/${esc(p.slug)}/" target="_blank" rel="noopener">${qi('eye', 15)}</a>${actionButton('page_delete', { page_id: p.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa trang “${p.title}”? Nhớ bỏ link tới trang này trong Menu.`)}</td></tr>`);
  return { title: 'Trang', actions: add, html: card('', `<table class="qt-table is-click"><thead><tr><th>Trang</th><th>Kiểu</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>`, '', 'is-flush') + '<p class="qt-help" style="margin-top:12px">Trang chủ, Cửa hàng, Giỏ hàng, Thanh toán, Tài khoản, Blog là các trang có sẵn của website (không cần tạo ở đây). Muốn trang mới hiện trên menu: vào mục Menu.</p>' };
}

async function pageEdit(id: number): Promise<AdminPage> {
  const p = id ? await db.page.findUnique({ where: { id } }) : null;
  if (id && !p) return { title: 'Không tìm thấy', back: qtUrl('trang'), html: empty('Trang không tồn tại.', 'file-text'), status: 404 };
  const main = field('title', 'Tiêu đề', p?.title || '', { required: true }) + field('content', 'Nội dung', p?.content || '', { type: 'editor' });
  const side = card('Thiết lập', field('publish', 'Hiện trên website', p ? p.status === 'publish' : true, { type: 'checkbox' }) + field('slug', 'Đường dẫn (để trống = tự tạo)', p?.slug || '', { help: p ? `Link: /${p.slug}/` : '' }) + field('template', 'Kiểu trang', p?.template || '', { type: 'select', options: TEMPLATES }));
  let form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" data-qt-dirty>${formFields('page_save')}<input type="hidden" name="page_id" value="${id}"><div class="qt-grid is-wide-left"><div class="qt-stack">${card('', main)}</div><div class="qt-stack">${side}</div></div><div class="qt-savebar"><span class="qt-muted" data-qt-dirty-note>Chưa có thay đổi</span><button class="qt-btn" type="submit">${qi('save', 18)} ${id ? 'Lưu trang' : 'Tạo trang'}</button></div></form>`;
  if (p) form += `<div class="qt-danger-zone">${actionButton('page_delete', { page_id: id }, qi('trash-2', 15) + ' Xóa trang', 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa trang “${p.title}”?`)}</div>`;
  return { title: p ? p.title : 'Thêm trang', back: qtUrl('trang'), html: form, actions: p ? `<a class="qt-btn qt-btn-ghost qt-btn-sm" href="/${esc(p.slug)}/" target="_blank" rel="noopener">${qi('eye', 16)} <span>Xem</span></a>` : '' };
}

/* ============================================================ Phản hồi khách hàng */

export async function pageTestimonials(id: string): Promise<AdminPage> {
  const list = await db.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
  const edit = id === 'moi' ? null : id ? list.find((t) => t.id === parseInt(id, 10)) : undefined;
  if (id) {
    if (id !== 'moi' && !edit) return { title: 'Không tìm thấy', back: qtUrl('phan-hoi'), html: empty('Phản hồi không tồn tại.', 'quote'), status: 404 };
    const t = edit || null;
    const body = field('name', 'Tên khách', t?.name || '', { required: true }) + field('role', 'Nghề nghiệp / chức vụ', t?.role || '', { placeholder: 'VD: CEO Công ty ABC' }) + field('content', 'Lời phản hồi', t?.content || '', { type: 'editor' }) + `<div class="qt-form-grid">${field('image', 'Ảnh khách (tròn)', t?.image || '', { type: 'image' })}${field('sort', 'Thứ tự', t?.sortOrder ?? list.length, { type: 'number' })}</div>`;
    const form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form">${formFields('testimonial_save')}<input type="hidden" name="t_id" value="${t?.id || 0}">${body}<div class="qt-form-foot"><button class="qt-btn" type="submit">${qi('save', 18)} Lưu</button><a class="qt-btn qt-btn-ghost" href="${qtUrl('phan-hoi')}">Hủy</a></div></form>`;
    return { title: t ? t.name : 'Thêm phản hồi', back: qtUrl('phan-hoi'), html: card('', form, '', 'is-narrow') };
  }
  const add = `<a class="qt-btn qt-btn-sm" href="${qtUrl('phan-hoi', 'moi')}">${qi('plus', 16)} <span>Thêm phản hồi</span></a>`;
  const rows = list.map((t) => `<li><div class="qt-list-main" style="flex-direction:row;gap:12px;align-items:center">${t.image ? `<img class="qt-thumb-sm" src="${esc(t.image)}" alt="" style="border-radius:50%;object-fit:cover">` : ''}<div><a href="${qtUrl('phan-hoi', t.id)}"><strong>${esc(t.name)}</strong></a><span class="qt-muted qt-block">${esc(t.role)}</span></div></div><div class="qt-list-side"><a class="qt-btn qt-btn-ghost qt-btn-sm" href="${qtUrl('phan-hoi', t.id)}">${qi('pencil', 15)} Sửa</a>${actionButton('testimonial_delete', { t_id: t.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa phản hồi của ${t.name}?`)}</div></li>`).join('');
  return { title: 'Phản hồi khách hàng', actions: add, html: card('', rows ? `<ul class="qt-list">${rows}</ul>` : empty('Chưa có phản hồi nào.', 'quote', add)) + '<p class="qt-help" style="margin-top:12px">Hiện ở khối "Khách hàng phản hồi" trang chủ và trang sản phẩm.</p>' };
}

/* ============================================================ Tin nhắn liên hệ */

export async function pageContacts(q: Q): Promise<AdminPage> {
  const done = q.loc === 'da-xu-ly';
  const page = Math.max(1, parseInt(q.trang, 10) || 1);
  const where = { status: done ? 'done' : 'new' };
  const [nNew, nDone, list] = await Promise.all([db.contact.count({ where: { status: 'new' } }), db.contact.count({ where: { status: 'done' } }), db.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20 })]);
  let html = `<div class="qt-toolbar"><nav class="qt-tabs"><a class="${done ? '' : 'is-active'}" href="${qtUrl('lien-he')}">Chưa xử lý <em>${nNew}</em></a><a class="${done ? 'is-active' : ''}" href="${qtUrl('lien-he', '', { loc: 'da-xu-ly' })}">Đã xử lý <em>${nDone}</em></a></nav></div>`;
  if (!list.length) return { title: 'Tin nhắn liên hệ', html: html + card('', empty(done ? 'Chưa có tin nhắn đã xử lý.' : 'Không có tin nhắn mới.', 'inbox')) };
  const items = list.map((c) => `<li><div class="qt-list-main"><strong>${esc(c.name)}</strong><span style="white-space:pre-wrap">${esc(c.message || '(không có nội dung)')}</span><span class="qt-muted">${esc(ago(c.createdAt))}${c.phone ? ' · ' + esc(c.phone) : ''}${c.email ? ' · ' + esc(c.email) : ''}${c.source ? ' · từ ' + esc(c.source) : ''}</span></div><div class="qt-list-side">${phoneLinks(c.phone)}${c.email ? `<a class="qt-chip" href="mailto:${esc(c.email)}">${qi('mail', 14)} Email</a>` : ''}${done ? actionButton('contact_undo', { contact_id: c.id }, qi('rotate-ccw', 15), 'qt-btn qt-btn-ghost qt-btn-sm') : actionButton('contact_done', { contact_id: c.id }, qi('check', 16) + ' Đã xử lý', 'qt-btn qt-btn-sm')}${actionButton('contact_delete', { contact_id: c.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa tin nhắn của ${c.name}?`)}</div></li>`).join('');
  html += card('', `<ul class="qt-list">${items}</ul>` + pager(page, Math.ceil((done ? nDone : nNew) / 20), qtUrl('lien-he', '', done ? { loc: 'da-xu-ly' } : {})));
  return { title: 'Tin nhắn liên hệ', html };
}

/* ============================================================ Nội dung website (Giao diện → Tùy biến) */

export async function pageContent(q: Q): Promise<AdminPage> {
  const s = await getSettings();
  const all = await getCategories();
  const catOpts = (allLabel: string) => ({ '': allLabel, ...Object.fromEntries(catTree(all).map(([c, d]) => [c.slug, '— '.repeat(d) + c.name])) });
  const active = FIELDS[q.tab] ? q.tab : 'brand';
  let form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form qt-settings" data-qt-dirty>${formFields('content_save')}<input type="hidden" name="tab" value="${esc(active)}" data-qt-tab-input><nav class="qt-tabs is-scroll" data-qt-tabs>`;
  form += Object.entries(FIELDS).map(([k, sec]) => `<a href="${qtUrl('noi-dung', '', { tab: k })}" data-tab="${k}" class="${k === active ? 'is-active' : ''}">${esc(sec.title.replace(/^Trang chủ: /, 'Trang chủ – '))}</a>`).join('') + '</nav>';
  for (const [key, sec] of Object.entries(FIELDS)) {
    let body = sec.description ? `<p class="qt-help" style="margin-bottom:14px">${esc(sec.description)}</p>` : '';
    for (const [k, [label, type]] of Object.entries(sec.fields)) {
      const v = s.site[k];
      const name = 'f_' + k;
      if (type === 'checkbox') body += `<input type="hidden" name="${name}" value="0">` + field(name, label, mod(s, k) === '1', { type: 'checkbox' });
      else if (type === 'gallery') body += field(name, label, Array.isArray(v) ? v : [], { type: 'gallery' });
      else if (type === 'cat' || type === 'cat-all') body += field(name, label, mod(s, k), { type: 'select', options: catOpts(type === 'cat' ? '— Không chọn —' : '— Tất cả sản phẩm (mới nhất) —') });
      else body += field(name, label, mod(s, k), { type: type === 'number' ? 'number' : type === 'email' ? 'email' : type === 'url' ? 'text' : type });
    }
    form += `<div class="qt-tab-panel" data-panel="${key}"${key === active ? '' : ' hidden'}>${card(sec.title, body)}</div>`;
  }
  form += `<div class="qt-savebar"><span class="qt-muted" data-qt-dirty-note>Chưa có thay đổi</span><button class="qt-btn" type="submit">${qi('save', 18)} Lưu nội dung</button></div></form>`;
  return { title: 'Nội dung website', html: form, actions: `<a class="qt-btn qt-btn-ghost qt-btn-sm" href="/" target="_blank" rel="noopener">${qi('eye', 16)} <span>Xem trang chủ</span></a>` };
}

/* ============================================================ Menu */

/** Menu dạng chữ: mỗi dòng "Tên | link", thêm "-" ở đầu dòng cho menu con. */
export function menuToText(items: MenuItem[], depth = 0): string {
  return items.map((it) => `${'-'.repeat(depth)}${depth ? ' ' : ''}${it.title} | ${it.url}${it.target === '_blank' ? ' | tab-moi' : ''}\n${menuToText(it.children, depth + 1)}`).join('');
}

export async function pageMenu(): Promise<AdminPage> {
  const s = await getSettings();
  const [cats, pages, blogCats] = await Promise.all([getCategories(), db.page.findMany({ where: { status: 'publish' }, orderBy: { title: 'asc' } }), db.blogCategory.findMany({ orderBy: { name: 'asc' } })]);
  let form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" data-qt-dirty>${formFields('menu_save')}<div class="qt-grid">`;
  for (const [loc, label] of Object.entries(MENU_LOCATIONS)) {
    const items = s.menus[loc as keyof typeof s.menus] || [];
    form += card(label, `<textarea name="menu_${loc}" rows="${Math.min(24, Math.max(6, menuToText(items).split('\n').length + 1))}" class="is-code" spellcheck="false">${esc(menuToText(items))}</textarea>`);
  }
  form += `</div><div class="qt-savebar"><span class="qt-muted" data-qt-dirty-note>Chưa có thay đổi</span><button class="qt-btn" type="submit">${qi('save', 18)} Lưu menu</button></div></form>`;
  const help = `<div class="qt-menu-help"><p>Mỗi dòng là 1 mục: <code>Tên hiển thị | link</code>. Thêm dấu <code>-</code> ở đầu dòng để làm menu con của dòng phía trên (<code>--</code> là cấp 3). Thêm <code>| tab-moi</code> ở cuối để mở link trong tab mới.</p><p>Ở Menu chính: mục nào có menu con là danh mục sản phẩm sẽ tự thành bảng lớn (ảnh + danh mục con) giống bản WordPress.</p></div>`;
  const ref = `<details><summary class="qt-link" style="cursor:pointer">Danh sách link có sẵn (bấm để xem, chép dán vào ô trên)</summary><div class="qt-grid" style="margin-top:12px"><div><h3 class="qt-h3">Trang</h3><pre class="qt-pre">Trang chủ | /\nCửa hàng | /cua-hang/\nBlog kiến thức | /blog/\nGiỏ hàng | /gio-hang/\nTài khoản | /tai-khoan/\n${pages.map((p) => `${p.title} | /${p.slug}/`).join('\n')}</pre><h3 class="qt-h3">Chuyên mục blog</h3><pre class="qt-pre">${blogCats.map((c) => `${c.name} | /category/${c.slug}/`).join('\n')}</pre></div><div><h3 class="qt-h3">Danh mục sản phẩm</h3><pre class="qt-pre">${catTree(cats).map(([c, d]) => `${'-'.repeat(d)}${d ? ' ' : ''}${c.name} | ${catUrl(c)}`).join('\n')}</pre></div></div></details>`;
  return { title: 'Menu', html: card('Cách sửa menu', help + ref) + form };
}

/* ============================================================ Thanh toán & cài đặt */

export async function pageSettings(q: Q): Promise<AdminPage> {
  const s = await getSettings();
  const tabs: Record<string, string> = { 'thanh-toan': 'Thanh toán', 'nhan-vien': 'Tài khoản quản trị', email: 'Email đã gửi' };
  const active = tabs[q.tab] ? q.tab : 'thanh-toan';
  const nav = `<nav class="qt-tabs is-scroll" style="margin-bottom:16px">${Object.entries(tabs).map(([k, l]) => `<a href="${qtUrl('cai-dat', '', { tab: k })}" class="${k === active ? 'is-active' : ''}">${esc(l)}</a>`).join('')}</nav>`;
  if (active === 'email') {
    const logs = await db.emailLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    const ml = logs.map((m) => `<li><details><summary><div class="qt-list-main"><strong>${esc(m.subject)}</strong><span class="qt-muted">Tới ${esc(m.to)} · ${esc(ago(m.createdAt))}</span></div>${m.sent ? badge('Đã gửi', 'ok') : badge(m.error ? 'Lỗi' : 'Chưa gửi', m.error ? 'bad' : 'mute')}</summary><pre class="qt-pre">${esc(m.body)}${m.error ? '\n\nLỗi: ' + esc(m.error) : ''}</pre></details></li>`).join('');
    return { title: 'Thanh toán & cài đặt', html: nav + card('Email đã gửi', `<p class="qt-help">Muốn gửi email thật: điền SMTP_HOST, SMTP_USER, SMTP_PASS trong file .env (xem hướng dẫn trong file).</p>${ml ? `<ul class="qt-list qt-inbox">${ml}</ul>` : empty('Chưa có email nào.', 'mail')}`) };
  }
  if (active === 'nhan-vien') {
    const staff = await db.user.findMany({ where: { role: { in: ['admin', 'staff'] } }, orderBy: { id: 'asc' } });
    const rows = staff.map((u) => `<li><div class="qt-list-main"><strong>${esc(u.name)}</strong><span class="qt-muted">Tên đăng nhập: <code class="qt-login">${esc(u.login)}</code> · ${esc(u.email)}</span></div><div class="qt-list-side">${badge(u.role === 'admin' ? 'Quản trị viên' : 'Nhân viên', u.role === 'admin' ? 'ok' : 'info')}${staff.length > 1 ? actionButton('staff_delete', { user_id: u.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', `Xóa tài khoản quản trị “${u.name}”?`) : ''}</div></li>`).join('');
    const add = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" autocomplete="off">${formFields('staff_save')}<div class="qt-form-grid">${field('name', 'Họ tên', '', { required: true })}${field('login', 'Tên đăng nhập', '', { required: true, attrs: 'autocapitalize="off" pattern="[A-Za-z0-9._\\-]{3,60}"' })}${field('email', 'Email', '', { type: 'email', required: true })}${field('password', 'Mật khẩu (ít nhất 6 ký tự)', '', { required: true, attrs: 'minlength="6" autocomplete="new-password"' })}${field('role', 'Quyền', 'staff', { type: 'select', options: { staff: 'Nhân viên (không vào được mục Cài đặt)', admin: 'Quản trị viên (vào được tất cả)' } })}</div><div class="qt-form-foot"><button class="qt-btn qt-btn-sm" type="submit">${qi('plus', 16)} Thêm tài khoản</button></div></form>`;
    return { title: 'Thanh toán & cài đặt', html: nav + `<div class="qt-grid">${card('Tài khoản quản trị', `<ul class="qt-list">${rows}</ul><p class="qt-help" style="margin-top:10px">Đổi tên / mật khẩu của chính bạn: mục "Tài khoản của tôi".</p>`)}${card('Thêm nhân viên', add)}</div>` };
  }
  const p = s.payments;
  let body = field('cod_enabled', 'Cho thanh toán khi nhận hàng (COD)', p.cod.enabled, { type: 'checkbox' }) + field('cod_title', 'Tên hiển thị', p.cod.title) + field('cod_instructions', 'Mô tả cho khách', p.cod.instructions, { type: 'textarea' });
  body += '<hr class="qt-hr">' + field('bacs_enabled', 'Cho thanh toán chuyển khoản (hiện mã QR sau khi đặt hàng)', p.bacs.enabled, { type: 'checkbox' }) + field('bacs_title', 'Tên hiển thị', p.bacs.title) + field('bacs_instructions', 'Hướng dẫn chuyển khoản', p.bacs.instructions, { type: 'textarea' });
  for (const i of [0, 1, 2]) {
    const a = p.bacs.accounts[i] || { bank: '', number: '', name: '' };
    body += `<h3 class="qt-h3">Tài khoản ${i + 1}${i ? ' (không bắt buộc)' : ''}</h3><div class="qt-form-grid is-3">${field(`acc_${i}_bank`, 'Ngân hàng', a.bank, { placeholder: 'VD: Vietcombank' })}${field(`acc_${i}_number`, 'Số tài khoản', a.number)}${field(`acc_${i}_name`, 'Chủ tài khoản', a.name, { placeholder: 'VIẾT HOA KHÔNG DẤU' })}</div>`;
  }
  body += '<p class="qt-help">Mã QR tự tạo cho các ngân hàng: Vietcombank, VietinBank, BIDV, Agribank, Techcombank, MB, ACB, VPBank, TPBank, Sacombank, HDBank, VIB, SHB, OCB, MSB, SeABank…</p>';
  const form = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" data-qt-dirty>${formFields('settings_save')}${card('Thanh toán', body)}<div class="qt-savebar"><span class="qt-muted" data-qt-dirty-note>Chưa có thay đổi</span><button class="qt-btn" type="submit">${qi('save', 18)} Lưu cài đặt</button></div></form>`;
  return { title: 'Thanh toán & cài đặt', html: nav + form };
}

/* ============================================================ Tài khoản của tôi */

export function pageAccount(me: User): AdminPage {
  let info = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" autocomplete="off">${formFields('me_save')}`;
  info += field('name', 'Tên hiển thị', me.name, { required: true });
  info += field('login', 'Tên đăng nhập', me.login, { required: true, help: 'Chỉ gồm chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang.', attrs: 'autocapitalize="off" spellcheck="false" pattern="[A-Za-z0-9._\\-]{3,60}"' });
  info += field('email', 'Email', me.email, { type: 'email', required: true, help: 'Email nhận link khi quên mật khẩu.' });
  info += '<hr class="qt-hr"><h3 class="qt-h3">Đổi mật khẩu</h3><p class="qt-help">Để trống 2 ô dưới nếu không đổi mật khẩu.</p>';
  info += field('pass1', 'Mật khẩu mới', '', { type: 'password', attrs: 'autocomplete="new-password" minlength="6"' }) + field('pass2', 'Nhập lại mật khẩu mới', '', { type: 'password', attrs: 'autocomplete="new-password" minlength="6"' });
  info += '<hr class="qt-hr">' + field('current', 'Mật khẩu hiện tại (bắt buộc để lưu)', '', { type: 'password', required: true, attrs: 'autocomplete="current-password"' });
  info += `<div class="qt-form-foot"><button class="qt-btn" type="submit">${qi('save', 18)} Lưu thay đổi</button></div></form>`;
  return { title: 'Tài khoản của tôi', html: card('Tên đăng nhập & mật khẩu', info, '', 'is-narrow') };
}
