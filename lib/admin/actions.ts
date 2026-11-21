// Quản trị: xử lý thao tác (lưu, xóa…). Mỗi hàm trả về thông báo + trang quay về.
import type { User } from '@prisma/client';
import { endOtherSessions } from '../auth';
import { db } from '../db';
import { slugify } from '../html';
import { addNote, orderCode, STATUS } from '../orders';
import { hashPassword, verifyPassword } from '../passwords';
import { FIELDS, getSettings, type MenuItem, MENU_LOCATIONS, saveSetting } from '../settings';
import { moneyValue, qtUrl } from './ui';

export type Result = { ok: boolean; msg: string; go?: string };
type F = FormData;
const str = (f: F, k: string) => String(f.get(k) ?? '').trim();
const int = (f: F, k: string) => parseInt(str(f, k), 10) || 0;
const all = (f: F, k: string) => f.getAll(k).map((x) => parseInt(String(x), 10)).filter((x) => x > 0);
const money = (f: F, k: string) => { const v = moneyValue(f.get(k)); return v === '' ? null : parseInt(v, 10); };
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const imgUrl = (v: string) => (v.startsWith('/') || /^https?:\/\//.test(v) ? v : '');
const list = (f: F, k: string): string[] => { try { const a = JSON.parse(str(f, k) || '[]'); return Array.isArray(a) ? a.map(String).filter(imgUrl) : []; } catch { return []; } };
/** Bỏ thẻ <script>, thuộc tính on…= khỏi nội dung soạn trong trình soạn thảo. */
const cleanHtml = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, '').replace(/javascript:/gi, '');

async function uniqueSlug(model: 'product' | 'category' | 'post' | 'page', want: string, id: number): Promise<string> {
  const base = slugify(want) || model;
  let slug = base;
  const exists = async (s: string) => {
    const r = await (db[model] as unknown as { findUnique: (a: object) => Promise<{ id: number } | null> }).findUnique({ where: { slug: s } });
    return r && r.id !== id;
  };
  for (let i = 2; await exists(slug); i++) slug = `${base}-${i}`;
  return slug;
}

/** Chữ trong ô Menu → cây menu. */
function parseMenu(text: string): MenuItem[] {
  const root: MenuItem[] = [];
  const stack: { depth: number; item: MenuItem }[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^\s*(-*)\s*(.+)$/);
    if (!m || !m[2].trim()) continue;
    const depth = m[1].length;
    const [title, url = '#', opt = ''] = m[2].split('|').map((x) => x.trim());
    const catSlug = url.match(/^\/danh-muc-san-pham\/([^/]+)\/?$/)?.[1] || '';
    const item: MenuItem = { title, url: url || '#', target: /tab-moi|_blank/.test(opt) ? '_blank' : '', object: catSlug ? 'product_cat' : '', catSlug, children: [] };
    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    (stack.length ? stack[stack.length - 1].item.children : root).push(item);
    stack.push({ depth, item });
  }
  return root;
}

export const ACTIONS: Record<string, (f: F, me: User) => Promise<Result>> = {
  /* ---------------- Đơn hàng */
  async order_status(f, me) {
    const id = int(f, 'order_id');
    const status = str(f, 'status');
    const o = await db.order.findUnique({ where: { id } });
    if (!o || !STATUS[status]) return { ok: false, msg: 'Không đổi được trạng thái đơn.' };
    await db.order.update({ where: { id }, data: { status, ...(status === 'completed' && o.paymentMethod === 'cod' ? { paid: true } : {}) } });
    await addNote(id, `Đổi trạng thái: ${STATUS[o.status]?.[0]} → ${STATUS[status][0]}.`, me.name);
    return { ok: true, msg: `Đơn ${orderCode(o)}: ${STATUS[status][0]}.` };
  },
  async order_paid(f, me) {
    const id = int(f, 'order_id');
    const paid = str(f, 'paid') === '1';
    await db.order.update({ where: { id }, data: { paid } });
    await addNote(id, paid ? 'Đã nhận đủ tiền.' : 'Đánh dấu chưa nhận tiền.', me.name);
    return { ok: true, msg: paid ? 'Đã đánh dấu: đã nhận tiền.' : 'Đã đánh dấu: chưa nhận tiền.' };
  },
  async order_shipping(f, me) {
    const id = int(f, 'order_id');
    const o = await db.order.findUnique({ where: { id } });
    if (!o) return { ok: false, msg: 'Không tìm thấy đơn hàng.' };
    const ship = money(f, 'shipping') || 0;
    await db.order.update({ where: { id }, data: { shipping: ship, total: o.subtotal + ship } });
    await addNote(id, `Phí giao hàng: ${ship.toLocaleString('vi-VN')}đ.`, me.name);
    return { ok: true, msg: 'Đã lưu phí giao hàng, tổng tiền đã cập nhật.' };
  },
  async order_note(f, me) {
    const id = int(f, 'order_id');
    const note = str(f, 'note').slice(0, 2000);
    if (!note || !(await db.order.findUnique({ where: { id } }))) return { ok: false, msg: 'Chưa thêm được ghi chú.' };
    await addNote(id, note, me.name);
    return { ok: true, msg: 'Đã thêm ghi chú.' };
  },
  async order_delete(f) {
    const o = await db.order.findUnique({ where: { id: int(f, 'order_id') } });
    if (!o) return { ok: false, msg: 'Không tìm thấy đơn hàng.', go: qtUrl('don-hang') };
    await db.order.delete({ where: { id: o.id } });
    return { ok: true, msg: `Đã xóa đơn ${orderCode(o)}.`, go: qtUrl('don-hang') };
  },

  /* ---------------- Khách hàng */
  async customer_update(f) {
    const id = int(f, 'user_id');
    const email = str(f, 'email').toLowerCase();
    if (!str(f, 'name') || !isEmail(email)) return { ok: false, msg: 'Vui lòng nhập họ tên và email đúng.' };
    const other = await db.user.findUnique({ where: { email } });
    if (other && other.id !== id) return { ok: false, msg: 'Email này đang thuộc về tài khoản khác.' };
    await db.user.update({ where: { id }, data: { name: str(f, 'name'), email, phone: str(f, 'phone'), address: str(f, 'address') } });
    return { ok: true, msg: 'Đã lưu thông tin khách hàng.' };
  },
  async customer_setpass(f) {
    const u = await db.user.findUnique({ where: { id: int(f, 'user_id') } });
    if (!u || u.role !== 'customer') return { ok: false, msg: 'Không tìm thấy khách hàng.' };
    const pass = String(f.get('password') ?? '');
    if (pass.length < 6) return { ok: false, msg: 'Mật khẩu mới cần ít nhất 6 ký tự.' };
    await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pass) } });
    await db.session.deleteMany({ where: { userId: u.id } });
    return { ok: true, msg: `Đã đặt mật khẩu mới cho ${u.name}. Báo cho khách: tên đăng nhập “${u.login}” (hoặc email ${u.email}), mật khẩu “${pass}”.` };
  },
  async customer_delete(f) {
    const u = await db.user.findUnique({ where: { id: int(f, 'user_id') } });
    if (!u || u.role !== 'customer') return { ok: false, msg: 'Chỉ xóa được tài khoản khách hàng.' };
    await db.user.delete({ where: { id: u.id } });
    return { ok: true, msg: `Đã xóa khách hàng ${u.name}.`, go: qtUrl('khach-hang') };
  },

  /* ---------------- Sản phẩm */
  async product_save(f) {
    let id = int(f, 'product_id');
    const name = str(f, 'name').slice(0, 200);
    if (!name) return { ok: false, msg: 'Vui lòng nhập tên sản phẩm.' };
    const existing = id ? await db.product.findUnique({ where: { id } }) : null;
    if (id && !existing) return { ok: false, msg: 'Không tìm thấy sản phẩm.' };
    const type = str(f, 'type') === 'variable' ? 'variable' : 'simple';
    const attrs: Record<string, string[]> = {};
    for (const a of await db.attribute.findMany()) {
      const v = f.getAll('attr_' + a.key).map(String).filter(Boolean);
      if (v.length) attrs[a.key] = v;
    }
    const data = {
      name,
      slug: await uniqueSlug('product', str(f, 'slug') || name, id),
      status: f.get('publish') ? 'publish' : 'draft',
      type,
      short: cleanHtml(str(f, 'short')),
      content: cleanHtml(str(f, 'content')),
      specs: str(f, 'specs').slice(0, 5000),
      regularPrice: money(f, 'regular_price'),
      salePrice: money(f, 'sale_price'),
      sku: str(f, 'sku').slice(0, 60),
      stock: str(f, 'stock') === 'outofstock' ? 'outofstock' : 'instock',
      image: imgUrl(str(f, 'image')),
      gallery: JSON.stringify(list(f, 'gallery')),
      attrs: JSON.stringify(attrs),
      featured: !!f.get('featured'),
      sortOrder: int(f, 'sort'),
    };
    if (id) await db.product.update({ where: { id }, data });
    else id = (await db.product.create({ data })).id;
    await db.productCategory.deleteMany({ where: { productId: id } });
    for (const c of [...new Set(all(f, 'cats'))]) await db.productCategory.create({ data: { productId: id, categoryId: c } });
    // Mẫu: dòng cũ (mã số) cập nhật, dòng mới ("n…") tạo mới, dòng bị bỏ thì xóa.
    const keys = f.getAll('v_keys').map(String).filter((k) => k && k !== '__N__');
    const keep: number[] = [];
    const attrKeys = (await db.attribute.findMany()).map((a) => a.key);
    for (const [i, k] of keys.entries()) {
      const va: Record<string, string> = {};
      for (const ak of attrKeys) { const v = str(f, `v_${k}_${ak}`); if (v) va[ak] = v; }
      const vd = { attrs: JSON.stringify(va), regularPrice: money(f, `v_${k}_regular`), salePrice: money(f, `v_${k}_sale`), image: imgUrl(str(f, `v_${k}_image`)), sku: str(f, `v_${k}_sku`).slice(0, 60), stock: str(f, `v_${k}_stock`) === 'outofstock' ? 'outofstock' : 'instock', sortOrder: i };
      const vid = /^\d+$/.test(k) ? parseInt(k, 10) : 0;
      if (vid && (await db.variation.findFirst({ where: { id: vid, productId: id } }))) {
        await db.variation.update({ where: { id: vid }, data: vd });
        keep.push(vid);
      } else keep.push((await db.variation.create({ data: { ...vd, productId: id } })).id);
    }
    await db.variation.deleteMany({ where: { productId: id, id: { notIn: keep } } });
    // Mẫu dùng giá trị thuộc tính nào thì tự đánh dấu vào sản phẩm (để bộ lọc tìm thấy).
    if (type === 'variable') {
      const vars = await db.variation.findMany({ where: { productId: id } });
      for (const v of vars) for (const [k, s] of Object.entries(JSON.parse(v.attrs) as Record<string, string>)) if (s && !(attrs[k] ||= []).includes(s)) attrs[k].push(s);
      await db.product.update({ where: { id }, data: { attrs: JSON.stringify(attrs) } });
    }
    let warn = '';
    if (type === 'variable' && !keep.length) warn = ' Sản phẩm "có nhiều mẫu" nhưng chưa có mẫu nào – khách chưa mua được.';
    if (type === 'simple' && data.regularPrice === null && data.salePrice === null) warn = ' Chưa nhập giá – website hiện "Liên hệ".';
    return { ok: !warn, msg: (existing ? 'Đã lưu sản phẩm.' : 'Đã tạo sản phẩm.') + (data.status === 'publish' ? '' : ' Sản phẩm đang ẩn.') + warn, go: qtUrl('san-pham', id) };
  },
  async product_delete(f) {
    const p = await db.product.findUnique({ where: { id: int(f, 'product_id') } });
    if (!p) return { ok: false, msg: 'Không tìm thấy sản phẩm.', go: qtUrl('san-pham') };
    await db.product.delete({ where: { id: p.id } });
    return { ok: true, msg: `Đã xóa sản phẩm “${p.name}”.`, go: qtUrl('san-pham') };
  },

  /* ---------------- Danh mục */
  async category_save(f) {
    let id = int(f, 'category_id');
    const name = str(f, 'name').slice(0, 120);
    if (!name) return { ok: false, msg: 'Vui lòng nhập tên danh mục.' };
    let parentId: number | null = int(f, 'parent') || null;
    if (parentId === id) parentId = null;
    const data = { name, slug: await uniqueSlug('category', str(f, 'slug') || name, id), parentId, sortOrder: int(f, 'sort'), image: imgUrl(str(f, 'image')), description: cleanHtml(str(f, 'description')), bannerTitle: str(f, 'banner_title').slice(0, 200), bannerText: str(f, 'banner_text').slice(0, 1000), bannerImage: imgUrl(str(f, 'banner_image')) };
    if (id) await db.category.update({ where: { id }, data });
    else id = (await db.category.create({ data })).id;
    return { ok: true, msg: 'Đã lưu danh mục.', go: qtUrl('danh-muc', id) };
  },
  async category_delete(f) {
    const c = await db.category.findUnique({ where: { id: int(f, 'category_id') } });
    if (!c) return { ok: false, msg: 'Không tìm thấy danh mục.', go: qtUrl('danh-muc') };
    await db.category.updateMany({ where: { parentId: c.id }, data: { parentId: c.parentId } });
    await db.category.delete({ where: { id: c.id } });
    return { ok: true, msg: `Đã xóa danh mục “${c.name}”.`, go: qtUrl('danh-muc') };
  },

  /* ---------------- Thuộc tính */
  async attribute_add(f) {
    const label = str(f, 'label').slice(0, 60);
    if (!label) return { ok: false, msg: 'Vui lòng nhập tên thuộc tính.' };
    let key = 'pa_' + (slugify(label) || 'thuoc-tinh');
    for (let i = 2; await db.attribute.findUnique({ where: { key } }); i++) key = 'pa_' + slugify(label) + '-' + i;
    await db.attribute.create({ data: { key, label } });
    return { ok: true, msg: `Đã thêm thuộc tính “${label}”.` };
  },
  async attribute_save(f) {
    const label = str(f, 'label').slice(0, 60);
    if (!label) return { ok: false, msg: 'Vui lòng nhập tên thuộc tính.' };
    await db.attribute.update({ where: { id: int(f, 'attribute_id') }, data: { label, filter: !!f.get('filter') } }).catch(() => null);
    return { ok: true, msg: 'Đã lưu thuộc tính.' };
  },
  async attribute_delete(f) {
    const a = await db.attribute.findUnique({ where: { id: int(f, 'attribute_id') } });
    if (!a) return { ok: false, msg: 'Không tìm thấy thuộc tính.' };
    await db.attribute.delete({ where: { id: a.id } });
    return { ok: true, msg: `Đã xóa thuộc tính “${a.label}”.` };
  },
  async term_add(f) {
    const name = str(f, 'name').slice(0, 60);
    const attributeId = int(f, 'attribute_id');
    if (!name || !attributeId) return { ok: false, msg: 'Vui lòng nhập tên.' };
    let slug = slugify(name) || 'gia-tri';
    for (let i = 2; await db.attrTerm.findUnique({ where: { attributeId_slug: { attributeId, slug } } }); i++) slug = slugify(name) + '-' + i;
    await db.attrTerm.create({ data: { attributeId, slug, name, sortOrder: await db.attrTerm.count({ where: { attributeId } }) } });
    return { ok: true, msg: `Đã thêm “${name}”.` };
  },
  async term_save(f) {
    const name = str(f, 'name').slice(0, 60);
    if (!name) return { ok: false, msg: 'Vui lòng nhập tên.' };
    await db.attrTerm.update({ where: { id: int(f, 'term_id') }, data: { name } }).catch(() => null);
    return { ok: true, msg: 'Đã đổi tên.' };
  },
  async term_delete(f) {
    const t = await db.attrTerm.findUnique({ where: { id: int(f, 'term_id') }, include: { attribute: true } });
    if (!t) return { ok: false, msg: 'Không tìm thấy.' };
    // Bỏ giá trị này khỏi các sản phẩm đang dùng.
    for (const p of await db.product.findMany({ where: { attrs: { contains: t.slug } } })) {
      const a = JSON.parse(p.attrs) as Record<string, string[]>;
      if (a[t.attribute.key]) a[t.attribute.key] = a[t.attribute.key].filter((s) => s !== t.slug);
      await db.product.update({ where: { id: p.id }, data: { attrs: JSON.stringify(a) } });
    }
    await db.attrTerm.delete({ where: { id: t.id } });
    return { ok: true, msg: `Đã xóa “${t.name}”.` };
  },

  /* ---------------- Bài viết, chuyên mục */
  async post_save(f) {
    let id = int(f, 'post_id');
    const title = str(f, 'title').slice(0, 250);
    if (!title) return { ok: false, msg: 'Vui lòng nhập tiêu đề.' };
    const d = str(f, 'date');
    const data = { title, slug: await uniqueSlug('post', str(f, 'slug') || title, id), content: cleanHtml(str(f, 'content')), excerpt: str(f, 'excerpt').slice(0, 1000), image: imgUrl(str(f, 'image')), status: f.get('publish') ? 'publish' : 'draft', ...(d ? { createdAt: new Date(d + ':00+07:00') } : {}) };
    // Bài viết và trang dùng chung đường dẫn /<slug>/ – tránh trùng với trang.
    if (await db.page.findUnique({ where: { slug: data.slug } })) data.slug += '-2';
    if (id) await db.post.update({ where: { id }, data });
    else id = (await db.post.create({ data })).id;
    await db.postCategory.deleteMany({ where: { postId: id } });
    for (const c of [...new Set(all(f, 'cats'))]) await db.postCategory.create({ data: { postId: id, categoryId: c } });
    return { ok: true, msg: data.status === 'publish' ? 'Đã lưu bài viết.' : 'Đã lưu bản nháp (chưa hiện trên website).', go: qtUrl('bai-viet', id) };
  },
  async post_delete(f) {
    const p = await db.post.findUnique({ where: { id: int(f, 'post_id') } });
    if (!p) return { ok: false, msg: 'Không tìm thấy bài viết.', go: qtUrl('bai-viet') };
    await db.post.delete({ where: { id: p.id } });
    return { ok: true, msg: `Đã xóa bài “${p.title}”.`, go: qtUrl('bai-viet') };
  },
  async blogcat_save(f) {
    const name = str(f, 'name').slice(0, 100);
    if (!name) return { ok: false, msg: 'Vui lòng nhập tên chuyên mục.' };
    const id = int(f, 'cat_id');
    if (id) await db.blogCategory.update({ where: { id }, data: { name } });
    else {
      let slug = slugify(name) || 'chuyen-muc';
      for (let i = 2; await db.blogCategory.findUnique({ where: { slug } }); i++) slug = slugify(name) + '-' + i;
      await db.blogCategory.create({ data: { name, slug } });
    }
    return { ok: true, msg: 'Đã lưu chuyên mục.' };
  },
  async blogcat_delete(f) {
    await db.blogCategory.delete({ where: { id: int(f, 'cat_id') } }).catch(() => null);
    return { ok: true, msg: 'Đã xóa chuyên mục.' };
  },

  /* ---------------- Trang */
  async page_save(f) {
    let id = int(f, 'page_id');
    const title = str(f, 'title').slice(0, 200);
    if (!title) return { ok: false, msg: 'Vui lòng nhập tiêu đề.' };
    const reserved = ['cua-hang', 'san-pham', 'danh-muc-san-pham', 'gio-hang', 'thanh-toan', 'tai-khoan', 'blog', 'category', 'quan-tri', 'api', 'uploads'];
    let slug = await uniqueSlug('page', str(f, 'slug') || title, id);
    if (reserved.includes(slug) || (await db.post.findUnique({ where: { slug } }))) slug += '-trang';
    const tpl = str(f, 'template');
    const data = { title, slug, content: cleanHtml(str(f, 'content')), template: ['about', 'contact'].includes(tpl) ? tpl : '', status: f.get('publish') ? 'publish' : 'draft' };
    if (id) await db.page.update({ where: { id }, data });
    else id = (await db.page.create({ data })).id;
    return { ok: true, msg: 'Đã lưu trang.', go: qtUrl('trang', id) };
  },
  async page_delete(f) {
    const p = await db.page.findUnique({ where: { id: int(f, 'page_id') } });
    if (!p) return { ok: false, msg: 'Không tìm thấy trang.', go: qtUrl('trang') };
    await db.page.delete({ where: { id: p.id } });
    return { ok: true, msg: `Đã xóa trang “${p.title}”.`, go: qtUrl('trang') };
  },

  /* ---------------- Phản hồi khách hàng */
  async testimonial_save(f) {
    const id = int(f, 't_id');
    const name = str(f, 'name').slice(0, 100);
    if (!name) return { ok: false, msg: 'Vui lòng nhập tên khách.' };
    const data = { name, role: str(f, 'role').slice(0, 150), content: cleanHtml(str(f, 'content')), image: imgUrl(str(f, 'image')), sortOrder: int(f, 'sort') };
    if (id) await db.testimonial.update({ where: { id }, data });
    else await db.testimonial.create({ data });
    return { ok: true, msg: 'Đã lưu phản hồi.', go: qtUrl('phan-hoi') };
  },
  async testimonial_delete(f) {
    await db.testimonial.delete({ where: { id: int(f, 't_id') } }).catch(() => null);
    return { ok: true, msg: 'Đã xóa phản hồi.', go: qtUrl('phan-hoi') };
  },

  /* ---------------- Tin nhắn liên hệ */
  async contact_done(f) {
    await db.contact.update({ where: { id: int(f, 'contact_id') }, data: { status: 'done' } }).catch(() => null);
    return { ok: true, msg: 'Đã chuyển sang "Đã xử lý".' };
  },
  async contact_undo(f) {
    await db.contact.update({ where: { id: int(f, 'contact_id') }, data: { status: 'new' } }).catch(() => null);
    return { ok: true, msg: 'Đã chuyển về "Chưa xử lý".' };
  },
  async contact_delete(f) {
    await db.contact.delete({ where: { id: int(f, 'contact_id') } }).catch(() => null);
    return { ok: true, msg: 'Đã xóa tin nhắn.' };
  },

  /* ---------------- Nội dung website, menu, cài đặt (chỉ quản trị viên – kiểm tra ở xu-ly/route.ts) */
  async content_save(f) {
    const s = await getSettings();
    const site: Record<string, string | string[]> = { ...s.site };
    for (const sec of Object.values(FIELDS)) {
      for (const [k, [, type]] of Object.entries(sec.fields)) {
        const name = 'f_' + k;
        if (type === 'checkbox') { if (f.has(name)) site[k] = f.getAll(name).includes('1') ? '1' : '0'; continue; }
        if (!f.has(name)) continue;
        if (type === 'gallery') site[k] = list(f, name);
        else if (type === 'image') site[k] = imgUrl(str(f, name));
        else if (type === 'number') site[k] = String(Math.max(0, Math.min(48, int(f, name))));
        else site[k] = str(f, name).slice(0, 5000);
      }
    }
    await saveSetting('site', site);
    const tab = str(f, 'tab');
    return { ok: true, msg: 'Đã lưu nội dung website.', go: qtUrl('noi-dung', '', tab ? { tab } : {}) };
  },
  async menu_save(f) {
    const menus: Record<string, MenuItem[]> = {};
    for (const loc of Object.keys(MENU_LOCATIONS)) menus[loc] = parseMenu(str(f, 'menu_' + loc));
    await saveSetting('menus', menus);
    return { ok: true, msg: 'Đã lưu menu.' };
  },
  async settings_save(f) {
    const accounts = [0, 1, 2].map((i) => ({ bank: str(f, `acc_${i}_bank`), number: str(f, `acc_${i}_number`), name: str(f, `acc_${i}_name`) })).filter((a) => a.bank || a.number);
    await saveSetting('payments', {
      cod: { enabled: !!f.get('cod_enabled'), title: str(f, 'cod_title') || 'Thanh toán khi nhận hàng (COD)', instructions: str(f, 'cod_instructions') },
      bacs: { enabled: !!f.get('bacs_enabled'), title: str(f, 'bacs_title') || 'Chuyển khoản ngân hàng', instructions: str(f, 'bacs_instructions'), accounts },
    });
    return { ok: true, msg: 'Đã lưu cài đặt thanh toán.' };
  },
  async staff_save(f) {
    const name = str(f, 'name');
    const login = str(f, 'login');
    const email = str(f, 'email').toLowerCase();
    const pass = String(f.get('password') ?? '');
    if (!name || !isEmail(email)) return { ok: false, msg: 'Vui lòng nhập họ tên và email đúng.' };
    if (!/^[A-Za-z0-9._-]{3,60}$/.test(login)) return { ok: false, msg: 'Tên đăng nhập cần 3–60 ký tự: chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang.' };
    if (pass.length < 6) return { ok: false, msg: 'Mật khẩu cần ít nhất 6 ký tự.' };
    if (await db.user.findFirst({ where: { OR: [{ login }, { email }] } })) return { ok: false, msg: 'Tên đăng nhập hoặc email đã có người dùng.' };
    await db.user.create({ data: { name, login, email, role: str(f, 'role') === 'admin' ? 'admin' : 'staff', passwordHash: await hashPassword(pass) } });
    return { ok: true, msg: `Đã thêm tài khoản ${login}.`, go: qtUrl('cai-dat', '', { tab: 'nhan-vien' }) };
  },
  async staff_delete(f, me) {
    const u = await db.user.findUnique({ where: { id: int(f, 'user_id') } });
    if (!u || u.role === 'customer') return { ok: false, msg: 'Không tìm thấy tài khoản.' };
    if (u.id === me.id) return { ok: false, msg: 'Không tự xóa tài khoản đang dùng được.' };
    await db.user.delete({ where: { id: u.id } });
    return { ok: true, msg: `Đã xóa tài khoản ${u.login}.`, go: qtUrl('cai-dat', '', { tab: 'nhan-vien' }) };
  },

  /* ---------------- Tài khoản của tôi */
  async me_save(f, me) {
    const name = str(f, 'name').slice(0, 100);
    const login = str(f, 'login');
    const email = str(f, 'email').toLowerCase();
    const p1 = String(f.get('pass1') ?? '');
    const p2 = String(f.get('pass2') ?? '');
    if (!(await verifyPassword(String(f.get('current') ?? ''), me.passwordHash)).ok) return { ok: false, msg: 'Mật khẩu hiện tại chưa đúng.' };
    if (!name) return { ok: false, msg: 'Vui lòng nhập tên hiển thị.' };
    if (!/^[A-Za-z0-9._-]{3,60}$/.test(login)) return { ok: false, msg: 'Tên đăng nhập cần 3–60 ký tự: chữ không dấu, số, dấu chấm, gạch dưới, gạch ngang.' };
    if (!isEmail(email)) return { ok: false, msg: 'Email chưa đúng.' };
    const dl = await db.user.findUnique({ where: { login } });
    if (dl && dl.id !== me.id) return { ok: false, msg: 'Tên đăng nhập này đã có người dùng.' };
    const de = await db.user.findUnique({ where: { email } });
    if (de && de.id !== me.id) return { ok: false, msg: 'Email này đang thuộc về tài khoản khác.' };
    const data: Record<string, string> = { name, login, email };
    if (p1 || p2) {
      if (p1.length < 6) return { ok: false, msg: 'Mật khẩu mới cần ít nhất 6 ký tự.' };
      if (p1 !== p2) return { ok: false, msg: 'Hai mật khẩu mới không khớp.' };
      data.passwordHash = await hashPassword(p1);
    }
    await db.user.update({ where: { id: me.id }, data });
    if (data.passwordHash) await endOtherSessions(me.id, 'admin');
    return { ok: true, msg: data.passwordHash ? 'Đã lưu. Mật khẩu mới có hiệu lực, các thiết bị khác đã bị đăng xuất.' : 'Đã lưu thông tin tài khoản.', go: qtUrl('tai-khoan') };
  },
};
