// Quản trị: Tổng quan, Đơn hàng, Khách hàng.
import type { Prisma, User } from '@prisma/client';
import { db } from '../db';
import { esc, vnDate } from '../html';
import { orderCode, orderKey, STATUS } from '../orders';
import { vnd } from '../shop';
import { actionButton, ago, badge, card, type AdminPage, empty, field, formFields, pager, phoneLinks, qi, qtUrl } from './ui';

type Q = Record<string, string>;
const st = (s: string) => STATUS[s] || [s, 'info'];
const PAID_STATUSES = ['processing', 'shipping', 'completed'];

/* ============================================================ Tổng quan */

export async function pageDashboard(user: User): Promise<AdminPage> {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [revenue, monthOrders, waiting, waitCount, contacts, contactNew, products, customers] = await Promise.all([
    db.order.aggregate({ _sum: { total: true }, where: { status: { in: PAID_STATUSES }, createdAt: { gte: monthStart } } }),
    db.order.count({ where: { createdAt: { gte: monthStart }, status: { not: 'cancelled' } } }),
    db.order.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' }, take: 6, include: { items: true } }),
    db.order.count({ where: { status: 'pending' } }),
    db.contact.findMany({ where: { status: 'new' }, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.contact.count({ where: { status: 'new' } }),
    db.product.count({ where: { status: 'publish' } }),
    db.user.count({ where: { role: 'customer' } }),
  ]);
  const stats: [string, string, string, string][] = [
    ['Doanh thu tháng này', vnd(revenue._sum.total || 0) || '0₫', 'receipt', qtUrl('don-hang')],
    ['Đơn chờ xác nhận', String(waitCount), 'alert-circle', qtUrl('don-hang', '', { loc: 'pending' })],
    ['Đơn tháng này', String(monthOrders), 'package', qtUrl('don-hang')],
    ['Tin nhắn mới', String(contactNew), 'inbox', qtUrl('lien-he')],
  ];
  let html = `<div class="qt-stats">${stats.map(([l, v, i, u]) => `<a class="qt-stat" href="${u}"><span class="qt-stat-ico">${qi(i, 22)}</span><span>${esc(l)}</span><strong>${esc(v)}</strong></a>`).join('')}</div><div class="qt-grid">`;
  const wl = waiting.map((o) => `<li><div class="qt-list-main"><a href="${qtUrl('don-hang', o.id)}"><strong>${orderCode(o)} · ${esc(o.name)}</strong></a><span>${esc(o.items.map((i) => i.name).join(', '))}</span><span class="qt-muted">${esc(ago(o.createdAt))} · ${esc(o.phone)}</span></div><div class="qt-list-side"><strong>${vnd(o.total)}</strong>${actionButton('order_status', { order_id: o.id, status: 'processing' }, qi('check', 16) + ' Xác nhận', 'qt-btn qt-btn-sm', `Xác nhận đơn ${orderCode(o)}? (Nên gọi cho khách trước.)`)}</div></li>`).join('');
  html += card('Đơn chờ xác nhận', wl ? `<ul class="qt-list">${wl}</ul>` : empty('Không có đơn nào đang chờ.', 'circle-check'), `<a class="qt-link" href="${qtUrl('don-hang')}">Tất cả đơn</a>`);
  const cl = contacts.map((c) => `<li><div class="qt-list-main"><strong>${esc(c.name)}</strong><span>${esc(c.message.slice(0, 90))}</span><span class="qt-muted">${esc(ago(c.createdAt))}${c.phone ? ' · ' + esc(c.phone) : ''}</span></div><div class="qt-list-side">${phoneLinks(c.phone)}</div></li>`).join('');
  html += card('Tin nhắn liên hệ mới', cl ? `<ul class="qt-list">${cl}</ul>` : empty('Chưa có tin nhắn mới.', 'inbox'), `<a class="qt-link" href="${qtUrl('lien-he')}">Xem tất cả</a>`);
  html += '</div>';
  let quick = `<a href="${qtUrl('san-pham', 'moi')}">${qi('plus', 22)}<span>Thêm sản phẩm</span></a><a href="${qtUrl('bai-viet', 'moi')}">${qi('newspaper', 22)}<span>Viết bài blog</span></a><a href="${qtUrl('khach-hang')}">${qi('users', 22)}<span>Khách hàng (${customers})</span></a><a href="/" target="_blank" rel="noopener">${qi('globe', 22)}<span>Xem website (${products} sản phẩm)</span></a>`;
  if (user.role === 'admin') quick += `<a href="${qtUrl('noi-dung')}">${qi('sliders-horizontal', 22)}<span>Sửa nội dung trang chủ</span></a><a href="${qtUrl('cai-dat')}">${qi('landmark', 22)}<span>Tài khoản nhận tiền</span></a>`;
  html += card('Làm nhanh', `<div class="qt-quick">${quick}</div>`);
  return { title: `Xin chào, ${user.name}`, html };
}

/* ============================================================ Đơn hàng */

const FILTERS: Record<string, [string, string[]]> = {
  '': ['Tất cả', Object.keys(STATUS)],
  pending: ['Chờ xác nhận', ['pending']],
  processing: ['Đã xác nhận', ['processing']],
  shipping: ['Đang giao', ['shipping']],
  completed: ['Hoàn thành', ['completed']],
  cancelled: ['Đã hủy', ['cancelled']],
};
const delConfirm = (o: { id: number }) => `Xóa hẳn đơn ${orderCode(o)}? Đơn sẽ mất khỏi danh sách và doanh thu, không khôi phục được.`;

export async function pageOrders(id: string, q: Q): Promise<AdminPage> {
  if (id) return orderDetail(parseInt(id, 10));
  const f = FILTERS[q.loc] ? q.loc : '';
  const search = (q.q || '').trim();
  const page = Math.max(1, parseInt(q.trang, 10) || 1);
  const where: Prisma.OrderWhereInput = { status: { in: FILTERS[f][1] } };
  if (search) {
    const n = parseInt(search.replace(/^#|^DH/i, ''), 10);
    where.OR = [{ name: { contains: search } }, { phone: { contains: search } }, { email: { contains: search } }, ...(n ? [{ id: n }] : [])];
  }
  const [total, orders] = await Promise.all([db.order.count({ where }), db.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20, include: { items: true } })]);
  let html = '<div class="qt-toolbar"><nav class="qt-tabs is-scroll">';
  for (const [slug, [label, sts]] of Object.entries(FILTERS)) html += `<a href="${qtUrl('don-hang', '', slug ? { loc: slug } : {})}" class="${slug === f ? 'is-active' : ''}">${esc(label)} <em>${await db.order.count({ where: { status: { in: sts } } })}</em></a>`;
  html += `</nav><form class="qt-search" method="get" action="${qtUrl('don-hang')}">${f ? `<input type="hidden" name="loc" value="${esc(f)}">` : ''}${qi('search', 16)}<input type="search" name="q" value="${esc(search)}" placeholder="Mã đơn, tên, SĐT…" aria-label="Tìm đơn hàng"></form></div>`;
  if (!orders.length) return { title: 'Đơn hàng', html: html + card('', empty(search ? 'Không tìm thấy đơn phù hợp.' : 'Chưa có đơn hàng nào ở mục này.', 'receipt')) };
  let rows = '';
  for (const o of orders) {
    const [label, tone] = st(o.status);
    const url = qtUrl('don-hang', o.id);
    rows += `<tr data-href="${url}"><td data-label="Đơn"><a href="${url}"><strong>${orderCode(o)}</strong></a><span class="qt-muted qt-block">${esc(vnDate(o.createdAt, true))}</span></td><td data-label="Khách"><strong>${esc(o.name)}</strong><span class="qt-muted qt-block">${esc(o.phone)}</span></td><td data-label="Sản phẩm">${esc(o.items.map((i) => `${i.name} ×${i.qty}`).join(', '))}</td><td data-label="Tổng tiền" class="qt-num"><strong>${vnd(o.total)}</strong><span class="qt-muted qt-block">${o.paymentMethod === 'bacs' ? (o.paid ? 'Đã chuyển khoản' : 'Chờ chuyển khoản') : 'COD'}</span></td><td data-label="Trạng thái">${badge(label, tone)}</td><td class="qt-row-actions">${o.status === 'pending' ? actionButton('order_status', { order_id: o.id, status: 'processing' }, qi('check', 16) + ' Xác nhận', 'qt-btn qt-btn-sm') : ''}${actionButton('order_delete', { order_id: o.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', delConfirm(o))}</td></tr>`;
  }
  const base = qtUrl('don-hang', '', { ...(f ? { loc: f } : {}), ...(search ? { q: search } : {}) });
  html += card('', `<table class="qt-table is-click"><thead><tr><th>Đơn</th><th>Khách</th><th>Sản phẩm</th><th class="qt-num">Tổng tiền</th><th>Trạng thái</th><th><span class="screen-reader-text">Thao tác</span></th></tr></thead><tbody>${rows}</tbody></table>` + pager(page, Math.ceil(total / 20), base), '', 'is-flush');
  return { title: 'Đơn hàng', html };
}

async function orderDetail(id: number): Promise<AdminPage> {
  const o = await db.order.findUnique({ where: { id }, include: { items: true, notes: { orderBy: { createdAt: 'desc' } } } });
  if (!o) return { title: 'Không tìm thấy đơn', back: qtUrl('don-hang'), html: empty('Đơn hàng không tồn tại hoặc đã bị xóa.', 'receipt'), status: 404 };
  const [label, tone] = st(o.status);
  const btn = (status: string, text: string, cls = 'qt-btn', confirm = '') => actionButton('order_status', { order_id: id, status }, text, cls, confirm);
  let bar = `<div class="qt-order-bar"><div>${badge(label, tone)}<span class="qt-muted">Đặt lúc ${esc(vnDate(o.createdAt, true))}</span></div><div class="qt-order-total">${vnd(o.total)}</div><div class="qt-btn-row">`;
  if (o.status === 'pending') bar += btn('processing', qi('check', 18) + ' Xác nhận đơn', 'qt-btn', `Xác nhận đơn ${orderCode(o)}? (Nên gọi cho khách trước.)`) + btn('cancelled', 'Hủy đơn', 'qt-btn qt-btn-ghost', `Hủy đơn ${orderCode(o)}?`);
  else if (o.status === 'processing') bar += btn('shipping', qi('truck', 18) + ' Bắt đầu giao hàng') + btn('cancelled', 'Hủy đơn', 'qt-btn qt-btn-ghost', `Hủy đơn ${orderCode(o)}?`);
  else if (o.status === 'shipping') bar += btn('completed', qi('circle-check', 18) + ' Đã giao xong') + btn('cancelled', 'Hủy đơn', 'qt-btn qt-btn-ghost', `Hủy đơn ${orderCode(o)}?`);
  else bar += btn('pending', qi('rotate-ccw', 16) + ' Mở lại đơn', 'qt-btn qt-btn-ghost', `Đưa đơn ${orderCode(o)} về "Chờ xác nhận"?`);
  bar += '</div></div>';

  const who = `<dl class="qt-dl"><dt>Họ tên</dt><dd><strong>${esc(o.name)}</strong></dd><dt>Điện thoại</dt><dd>${esc(o.phone)} ${phoneLinks(o.phone)}</dd><dt>Email</dt><dd>${o.email ? `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>` : '—'}</dd><dt>Địa chỉ</dt><dd>${esc(o.address)}</dd>${o.note ? `<dt>Khách ghi chú</dt><dd>${esc(o.note)}</dd>` : ''}</dl>`;
  const items = `<ul class="qt-list">${o.items.map((it) => `<li><div class="qt-list-main" style="flex-direction:row;align-items:center;gap:12px">${it.image ? `<img class="qt-thumb-sm" src="${esc(it.image)}" alt="">` : ''}<div><strong>${esc(it.name)}</strong> × ${it.qty}${it.variant ? `<span class="qt-muted qt-block">${esc(it.variant)}</span>` : ''}<span class="qt-muted qt-block">${vnd(it.price)} / cái</span></div></div><div class="qt-list-side"><strong>${vnd(it.total)}</strong></div></li>`).join('')}</ul>`;
  let pay = `<dl class="qt-dl"><dt>Hình thức</dt><dd>${esc(o.paymentTitle)}</dd><dt>Tạm tính</dt><dd>${vnd(o.subtotal)}</dd><dt>Phí giao hàng</dt><dd>${o.shipping ? vnd(o.shipping) : 'Chưa nhập'}</dd><dt>Tổng cộng</dt><dd><strong>${vnd(o.total)}</strong></dd><dt>Đã nhận tiền</dt><dd>${o.paid ? badge('Đã nhận', 'ok') : badge('Chưa', 'warn')}</dd></dl>`;
  pay += `<form method="post" action="/quan-tri/xu-ly/" class="qt-form" style="margin-top:14px">${formFields('order_shipping')}<input type="hidden" name="order_id" value="${id}">${field('shipping', 'Phí giao hàng (báo cho khách)', o.shipping || '', { type: 'money' })}<div class="qt-form-foot"><button class="qt-btn qt-btn-sm" type="submit">${qi('save', 16)} Lưu phí giao hàng</button></div></form>`;
  pay += `<div class="qt-btn-row" style="margin-top:10px">${actionButton('order_paid', { order_id: id, paid: o.paid ? 0 : 1 }, o.paid ? 'Đánh dấu chưa nhận tiền' : qi('check', 16) + ' Đã nhận đủ tiền', o.paid ? 'qt-btn qt-btn-ghost qt-btn-sm' : 'qt-btn qt-btn-sm')}<a class="qt-btn qt-btn-ghost qt-btn-sm" href="/thanh-toan/da-dat/${o.id}/?key=${orderKey(o)}" target="_blank" rel="noopener">${qi('eye', 15)} Trang đơn của khách</a></div>`;
  let nh = `<form method="post" action="/quan-tri/xu-ly/" class="qt-note-form">${formFields('order_note')}<input type="hidden" name="order_id" value="${id}"><textarea name="note" rows="2" placeholder="Ghi chú nội bộ (khách không thấy)…" required></textarea><button class="qt-btn qt-btn-sm" type="submit">Thêm ghi chú</button></form>`;
  if (o.notes.length) nh += '<ul class="qt-timeline">' + o.notes.map((n) => `<li><p>${esc(n.content)}</p><span class="qt-muted">${esc(vnDate(n.createdAt, true))}${n.author && n.author !== 'system' ? ' · ' + esc(n.author) : ''}</span></li>`).join('') + '</ul>';
  let html = bar + '<div class="qt-grid">' + card('Khách hàng', who, o.userId ? `<a class="qt-link" href="${qtUrl('khach-hang', o.userId)}">Xem tài khoản</a>` : '') + card('Thanh toán', pay) + card('Sản phẩm trong đơn', items) + card('Lịch sử & ghi chú', nh) + '</div>';
  html += `<div class="qt-danger-zone">${actionButton('order_delete', { order_id: id }, qi('trash-2', 15) + ' Xóa đơn hàng', 'qt-btn qt-btn-ghost qt-btn-sm is-danger', delConfirm(o))}</div>`;
  return { title: `Đơn hàng ${orderCode(o)}`, back: qtUrl('don-hang'), html };
}

/* ============================================================ Khách hàng */

function passBox(userId: number, name: string): string {
  return `<details class="qt-passbox"><summary class="qt-btn qt-btn-ghost qt-btn-sm">${qi('lock', 14)} Đổi mật khẩu</summary><form method="post" action="/quan-tri/xu-ly/" class="qt-passbox-form" autocomplete="off">${formFields('customer_setpass')}<input type="hidden" name="user_id" value="${userId}"><label class="screen-reader-text" for="np-${userId}">Mật khẩu mới cho ${esc(name)}</label><input type="text" id="np-${userId}" name="password" required minlength="6" placeholder="Mật khẩu mới (ít nhất 6 ký tự)" autocomplete="new-password" spellcheck="false"><button class="qt-btn qt-btn-sm" type="submit">Lưu</button></form></details>`;
}
const delCustomer = (u: { name: string; email: string }) => `Xóa khách hàng “${u.name}” (${u.email})? Đơn hàng cũ vẫn được giữ lại. Không khôi phục được.`;

export async function pageCustomers(id: string, q: Q): Promise<AdminPage> {
  if (id) return customerDetail(parseInt(id, 10));
  const search = (q.q || '').trim();
  const page = Math.max(1, parseInt(q.trang, 10) || 1);
  const where: Prisma.UserWhereInput = { role: 'customer' };
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }, { login: { contains: search } }, { phone: { contains: search } }];
  const [total, users] = await Promise.all([db.user.count({ where }), db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20, include: { orders: { select: { total: true, status: true } } } })]);
  let html = `<div class="qt-toolbar"><p class="qt-muted">${total} khách hàng có tài khoản</p><form class="qt-search" method="get" action="${qtUrl('khach-hang')}">${qi('search', 16)}<input type="search" name="q" value="${esc(search)}" placeholder="Tên, email, SĐT…" aria-label="Tìm khách hàng"></form></div>`;
  if (!users.length) return { title: 'Khách hàng', html: html + card('', empty(search ? 'Không tìm thấy khách phù hợp.' : 'Chưa có khách hàng nào đăng ký tài khoản.', 'users')) };
  const rows = users.map((u) => {
    const url = qtUrl('khach-hang', u.id);
    const spent = u.orders.filter((o) => PAID_STATUSES.includes(o.status)).reduce((a, o) => a + o.total, 0);
    return `<tr data-href="${url}"><td data-label="Khách hàng"><a href="${url}"><strong>${esc(u.name)}</strong></a><span class="qt-muted qt-block">${esc(u.email)}</span></td><td data-label="Tên đăng nhập"><div class="qt-login-cell"><code class="qt-login">${esc(u.login)}</code>${passBox(u.id, u.name)}</div></td><td data-label="Điện thoại">${esc(u.phone || '—')}</td><td data-label="Đơn hàng">${u.orders.length} đơn${spent ? ` · ${vnd(spent)}` : ''}</td><td data-label="Tham gia">${esc(vnDate(u.createdAt))}</td><td class="qt-row-actions">${actionButton('customer_delete', { user_id: u.id }, qi('trash-2', 15), 'qt-btn qt-btn-ghost qt-btn-sm is-danger', delCustomer(u))}</td></tr>`;
  });
  html += card('', `<table class="qt-table is-click"><thead><tr><th>Khách hàng</th><th>Tên đăng nhập</th><th>Điện thoại</th><th>Đơn hàng</th><th>Tham gia</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table>` + pager(page, Math.ceil(total / 20), qtUrl('khach-hang', '', search ? { q: search } : {})), '', 'is-flush');
  return { title: 'Khách hàng', html };
}

async function customerDetail(id: number): Promise<AdminPage> {
  const u = await db.user.findUnique({ where: { id }, include: { orders: { orderBy: { createdAt: 'desc' }, include: { items: true } } } });
  if (!u || u.role !== 'customer') return { title: 'Không tìm thấy', back: qtUrl('khach-hang'), html: empty('Khách hàng không tồn tại.', 'users'), status: 404 };
  let edit = `<form method="post" action="/quan-tri/xu-ly/" class="qt-form">${formFields('customer_update')}<input type="hidden" name="user_id" value="${id}">${field('name', 'Họ và tên', u.name, { required: true })}${field('phone', 'Số điện thoại', u.phone, { type: 'tel' })}${field('email', 'Email', u.email, { type: 'email', required: true })}${field('address', 'Địa chỉ', u.address)}<div class="qt-form-foot"><button class="qt-btn qt-btn-sm" type="submit">${qi('save', 16)} Lưu</button></div></form>`;
  edit += `<hr class="qt-hr"><h3 class="qt-h3">Đăng nhập</h3><dl class="qt-dl"><dt>Tên đăng nhập</dt><dd><div class="qt-login-cell"><code class="qt-login">${esc(u.login)}</code>${passBox(u.id, u.name)}</div></dd><dt>Hoặc email</dt><dd>${esc(u.email)}</dd><dt>Mật khẩu</dt><dd class="qt-muted">Được mã hóa nên không xem được. Khách quên mật khẩu thì bấm "Đổi mật khẩu" rồi báo mật khẩu mới cho khách.</dd></dl>`;
  const ol = u.orders.map((o) => { const [l, t] = st(o.status); return `<li><div class="qt-list-main"><a href="${qtUrl('don-hang', o.id)}"><strong>${orderCode(o)}</strong></a><span>${esc(o.items.map((i) => i.name).join(', '))}</span><span class="qt-muted">${esc(vnDate(o.createdAt))}</span></div><div class="qt-list-side"><strong>${vnd(o.total)}</strong>${badge(l, t)}</div></li>`; }).join('');
  const head = `<div class="qt-profile"><span class="qt-avatar" style="width:64px;height:64px;border-radius:50%;background:var(--qt-primary-soft);color:var(--qt-primary);display:grid;place-items:center;font:800 26px var(--qt-head);flex:none">${esc(u.name.charAt(0).toUpperCase())}</span><div><h2>${esc(u.name)}</h2><p class="qt-muted">Tên đăng nhập: <strong>${esc(u.login)}</strong> · ${esc(u.email)}${u.phone ? ' · ' + esc(u.phone) : ''} · Tham gia ${esc(vnDate(u.createdAt))}</p><div class="qt-btn-row">${phoneLinks(u.phone)}<a class="qt-chip" href="mailto:${esc(u.email)}">${qi('mail', 14)} Email</a></div></div></div>`;
  const html = card('', head, '', 'is-profile') + `<div class="qt-grid is-wide-left">${card('Đơn hàng', ol ? `<ul class="qt-list">${ol}</ul>` : empty('Khách chưa đặt đơn nào.', 'receipt'))}${card('Thông tin khách hàng', edit)}</div><div class="qt-danger-zone">${actionButton('customer_delete', { user_id: id }, qi('trash-2', 15) + ' Xóa khách hàng', 'qt-btn qt-btn-ghost qt-btn-sm is-danger', delCustomer(u))}</div>`;
  return { title: u.name, back: qtUrl('khach-hang'), html };
}
