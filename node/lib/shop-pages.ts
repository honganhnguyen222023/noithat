// Trang giỏ hàng, thanh toán, đặt hàng xong, tài khoản khách hàng.
import type { User } from '@prisma/client';
import { cartLines } from './cart';
import { db } from './db';
import { esc, vnDate } from './html';
import { ic } from './icons';
import { breadcrumbs } from './layout';
import { bankBox, orderCode, orderKey, orderTable, STATUS } from './orders';
import { type Settings } from './settings';
import { money, productUrl, vnd } from './shop';

export const NOTICES: Record<string, [string, 'ok' | 'err']> = {
  'da-cap-nhat': ['Đã cập nhật giỏ hàng.', 'ok'],
  'da-xoa': ['Đã bỏ sản phẩm khỏi giỏ hàng.', 'ok'],
  sai: ['Email/tên đăng nhập hoặc mật khẩu chưa đúng.', 'err'],
  khoa: ['Bạn đã nhập sai nhiều lần. Vui lòng thử lại sau 15 phút hoặc bấm "Quên mật khẩu".', 'err'],
  'thieu-ten': ['Vui lòng nhập họ và tên.', 'err'],
  'sai-sdt': ['Số điện thoại chưa đúng.', 'err'],
  'sai-email': ['Email chưa đúng.', 'err'],
  'can-email': ['Muốn tạo tài khoản, vui lòng nhập email.', 'err'],
  'thieu-dia-chi': ['Vui lòng nhập địa chỉ nhận hàng.', 'err'],
  'chon-tt': ['Vui lòng chọn cách thanh toán.', 'err'],
  'mk-ngan': ['Mật khẩu cần ít nhất 6 ký tự.', 'err'],
  'mk-khac': ['Hai mật khẩu không khớp.', 'err'],
  'trung-email': ['Email này đã có tài khoản. Vui lòng đăng nhập.', 'err'],
  'sai-mk-cu': ['Mật khẩu hiện tại chưa đúng.', 'err'],
  'da-luu': ['Đã lưu thông tin tài khoản.', 'ok'],
  'da-gui': ['Nếu thông tin bạn nhập có tài khoản, chúng tôi đã gửi email kèm link đặt lại mật khẩu. Kiểm tra cả hộp thư Spam nhé.', 'ok'],
  'het-han': ['Link đặt lại mật khẩu đã hết hạn hoặc không đúng. Vui lòng yêu cầu lại.', 'err'],
  'da-doi-mk': ['Đã đổi mật khẩu thành công. Mời bạn đăng nhập.', 'ok'],
};

export function notice(tb: string): string {
  const n = NOTICES[tb];
  if (!n) return '';
  return n[1] === 'err' ? `<ul class="woocommerce-error" role="alert"><li>${esc(n[0])}</li></ul>` : `<div class="woocommerce-message" role="status">${esc(n[0])}</div>`;
}

/** Khung trang: breadcrumb + tiêu đề + nội dung (giống page.php với .wc-page). */
export function shell(title: string, crumbs: [string, string?][], body: string, tb = ''): string {
  return `<div class="container-x py-6 lg:py-8">${breadcrumbs(crumbs, 'mb-6 text-[17px]')}<article class="wc-page"><h1 class="mb-6 text-[28px] leading-tight font-bold text-gold lg:text-[34px]">${esc(title)}</h1>${notice(tb)}${body}</article></div>`;
}

const field = (name: string, label: string, value = '', type = 'text', extra = '') => `<label class="field"><span>${label}</span><input type="${type}" name="${name}" value="${esc(value)}" ${extra}></label>`;

/* ---------------------------------------------------------------- Giỏ hàng */

export async function cartHtml(tb: string): Promise<string> {
  const lines = await cartLines();
  if (!lines.length) {
    return shell('Giỏ hàng', [['Giỏ hàng']], `<div class="ns-empty">${ic('shopping-bag', 'size-12')}<p>Giỏ hàng của bạn đang trống.</p><a href="/cua-hang/" class="btn-gold">Xem sản phẩm</a></div>`, tb);
  }
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  let rows = '';
  for (const l of lines) {
    const url = productUrl(l.product);
    rows += `<tr><td class="ns-cart-product"><a href="${url}" class="ns-thumb">${l.image ? `<img src="${esc(l.image)}" alt="" loading="lazy">` : ''}</a><div><a href="${url}" class="font-bold hover:text-gold">${esc(l.product.name)}</a>${l.variant ? `<small>${esc(l.variant)}</small>` : ''}<span class="ns-mobile-price">${money(l.price)}</span></div></td>
<td class="ns-num ns-hide-sm" data-title="Giá">${money(l.price)}</td>
<td data-title="Số lượng"><div class="quantity ns-qty"><input type="number" name="qty[${l.key}]" value="${l.qty}" min="0" max="99" aria-label="Số lượng ${esc(l.product.name)}"></div></td>
<td class="ns-num" data-title="Tạm tính"><strong>${money(l.total)}</strong></td>
<td><button type="submit" form="rm-${l.key.replace(':', '-')}" class="ns-remove" aria-label="Bỏ ${esc(l.product.name)} khỏi giỏ">${ic('x', 'size-4')}</button></td></tr>`;
  }
  const removeForms = lines.map((l) => `<form id="rm-${l.key.replace(':', '-')}" method="post" action="/api/form/xoa-khoi-gio/" hidden><input type="hidden" name="key" value="${l.key}"></form>`).join('');
  const body = `<div class="ns-cart"><form method="post" action="/api/form/cap-nhat-gio/" class="ns-card ns-flush"><table class="ns-table ns-cart-table"><thead><tr><th>Sản phẩm</th><th class="ns-num ns-hide-sm">Giá</th><th>Số lượng</th><th class="ns-num">Tạm tính</th><th><span class="sr-only">Bỏ</span></th></tr></thead><tbody>${rows}</tbody></table>
<div class="ns-cart-actions"><a href="/cua-hang/" class="ns-link">${ic('arrow-left', 'size-4')} Tiếp tục mua sắm</a><button type="submit" class="btn-outline">Cập nhật giỏ hàng</button></div></form>${removeForms}
<aside class="ns-card ns-totals"><h2>Cộng giỏ hàng</h2><dl><dt>Tạm tính</dt><dd>${money(subtotal)}</dd><dt>Giao hàng</dt><dd>Cửa hàng gọi báo phí</dd><dt class="ns-total">Tổng cộng</dt><dd class="ns-total">${money(subtotal)}</dd></dl><a href="/thanh-toan/" class="btn-gold ns-block">Tiến hành thanh toán ${ic('chevron-right', 'size-4')}</a></aside></div>`;
  return shell('Giỏ hàng', [['Giỏ hàng']], body, tb);
}

/* ---------------------------------------------------------------- Thanh toán */

export async function checkoutHtml(s: Settings, user: User | null, tb: string): Promise<string | null> {
  const lines = await cartLines();
  if (!lines.length) return null;
  const subtotal = lines.reduce((a, l) => a + l.total, 0);
  const p = s.payments;
  const methods = (['cod', 'bacs'] as const).filter((m) => p[m].enabled);
  let form = `<form method="post" action="/api/form/dat-hang/" class="ns-checkout"><div class="ns-card"><h2>Thông tin nhận hàng</h2>`;
  if (!user) form += `<p class="ns-info">Đã có tài khoản? <a href="/tai-khoan/?redirect_to=%2Fthanh-toan%2F" class="font-bold text-gold underline">Đăng nhập</a> để điền sẵn thông tin và xem lại đơn hàng sau này.</p>`;
  form += `<div class="ns-grid-2">${field('name', 'Họ và tên *', user?.name || '', 'text', 'required autocomplete="name"')}${field('phone', 'Số điện thoại *', user?.phone || '', 'tel', 'required inputmode="tel" autocomplete="tel"')}</div>`;
  form += field('email', 'Email (nhận thông báo đơn hàng)', user?.email || '', 'email', 'autocomplete="email"');
  form += field('address', 'Địa chỉ nhận hàng *', user?.address || '', 'text', 'required autocomplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"');
  form += `<label class="field"><span>Ghi chú</span><textarea name="note" rows="3" placeholder="Thời gian giao hàng mong muốn, yêu cầu lắp đặt…"></textarea></label>`;
  if (!user) form += `<label class="ns-check"><input type="checkbox" name="create_account" value="1" data-toggle-next> Tạo tài khoản để theo dõi đơn hàng</label><div class="ns-collapse" hidden>${field('account_password', 'Mật khẩu cho tài khoản mới (ít nhất 6 ký tự)', '', 'password', 'autocomplete="new-password" minlength="6"')}</div>`;
  form += '</div><div class="ns-card ns-review"><h2>Đơn hàng của bạn</h2><table class="ns-table"><tbody>';
  for (const l of lines) form += `<tr><td><div class="ns-line">${l.image ? `<img src="${esc(l.image)}" alt="" width="56" height="56" loading="lazy">` : ''}<div><strong>${esc(l.product.name)}</strong> × ${l.qty}${l.variant ? `<small>${esc(l.variant)}</small>` : ''}</div></div></td><td class="ns-num">${money(l.total)}</td></tr>`;
  form += `</tbody><tfoot><tr><th>Tạm tính</th><td class="ns-num">${money(subtotal)}</td></tr><tr><th>Giao hàng</th><td class="ns-num">Cửa hàng gọi báo phí</td></tr><tr class="ns-total"><th>Tổng cộng</th><td class="ns-num">${money(subtotal)}</td></tr></tfoot></table>`;
  form += '<h3>Cách thanh toán</h3><div class="ns-pay">';
  methods.forEach((m, i) => {
    form += `<label class="ns-pay-opt"><input type="radio" name="payment" value="${m}"${i === 0 ? ' checked' : ''} required><span><strong>${esc(p[m].title)}</strong><small>${esc(m === 'cod' ? p.cod.instructions : 'Hiện mã QR và số tài khoản sau khi đặt hàng.')}</small></span></label>`;
  });
  if (!methods.length) form += '<p class="ns-info">Cửa hàng chưa bật cách thanh toán nào. Vui lòng gọi hotline để đặt hàng.</p>';
  form += `</div><button type="submit" class="btn-gold ns-block"${methods.length ? '' : ' disabled'}>${ic('package-check', 'size-5')} Đặt hàng</button><p class="ns-muted">Sau khi đặt, cửa hàng sẽ gọi điện xác nhận đơn và báo phí giao hàng.</p></div></form>`;
  return shell('Thanh toán', [['Giỏ hàng', '/gio-hang/'], ['Thanh toán']], form, tb);
}

export async function thankYouHtml(s: Settings, id: number, key: string, user: User | null): Promise<string | null> {
  const o = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!o || (key !== orderKey(o) && (!user || o.userId !== user.id))) return null;
  let body = `<div class="woocommerce-message" role="status"><span class="flex items-center gap-2">${ic("circle-check", "size-5")} Cảm ơn bạn! Chúng tôi đã nhận được đơn hàng ${orderCode(o)} và sẽ gọi điện xác nhận sớm.</span></div>`;
  if (o.paymentMethod === 'bacs' && !o.paid && o.status !== 'cancelled') body += bankBox(s, o);
  body += `<div class="ns-card">${orderTable(o)}</div>`;
  if (o.userId) body += `<p class="mt-6"><a href="/tai-khoan/don-hang/" class="ns-link">Xem các đơn hàng của bạn ${ic('chevron-right', 'size-4')}</a></p>`;
  return shell('Đặt hàng thành công', [['Đặt hàng thành công']], body);
}

/* ---------------------------------------------------------------- Tài khoản */

const MENU: [string, string, string][] = [
  ['tong-quan', 'Tổng quan', '/tai-khoan/'],
  ['don-hang', 'Đơn hàng', '/tai-khoan/don-hang/'],
  ['thong-tin', 'Thông tin tài khoản', '/tai-khoan/thong-tin/'],
  ['dang-xuat', 'Đăng xuất', '/tai-khoan/dang-xuat/'],
];
export function accountShell(active: string, title: string, body: string, tb = '', crumbs: [string, string?][] = []): string {
  const nav = `<nav class="ns-account-nav" aria-label="Tài khoản">${MENU.map(([k, l, u]) => `<a href="${u}" class="${k === active ? 'is-active' : ''}"${k === active ? ' aria-current="page"' : ''}>${esc(l)}</a>`).join('')}</nav>`;
  return shell(title, crumbs.length ? crumbs : [['Tài khoản']], `<div class="ns-account">${nav}<div class="min-w-0">${body}</div></div>`, tb);
}

export function loginHtml(tb: string, back: string, register: boolean): string {
  const keep = back ? '?redirect_to=' + encodeURIComponent(back) : '';
  const hid = `<input type="hidden" name="redirect_to" value="${esc(back)}">`;
  const body = register
    ? `<form method="post" action="/api/form/dang-ky/" class="ns-card ns-auth">${hid}${field('name', 'Họ và tên *', '', 'text', 'required autocomplete="name"')}${field('phone', 'Số điện thoại *', '', 'tel', 'required inputmode="tel" autocomplete="tel"')}${field('email', 'Email *', '', 'email', 'required autocomplete="email"')}${field('password', 'Mật khẩu * (ít nhất 6 ký tự)', '', 'password', 'required minlength="6" autocomplete="new-password"')}<button type="submit" class="btn-gold ns-block">Đăng ký</button><p class="ns-auth-switch">Đã có tài khoản? <a href="/tai-khoan/${keep}">Đăng nhập</a></p></form>`
    : `<form method="post" action="/api/form/dang-nhap/" class="ns-card ns-auth">${hid}${field('username', 'Email hoặc tên đăng nhập *', '', 'text', 'required autocomplete="username" autocapitalize="off"')}${field('password', 'Mật khẩu *', '', 'password', 'required autocomplete="current-password"')}<div class="ns-auth-row"><label class="ns-check"><input type="checkbox" name="rememberme" value="1" checked> Ghi nhớ đăng nhập</label><a href="/tai-khoan/quen-mat-khau/" class="ns-link">Quên mật khẩu?</a></div><button type="submit" class="btn-gold ns-block">Đăng nhập</button><p class="ns-auth-switch">Chưa có tài khoản? <a href="/tai-khoan/dang-ky/${keep}">Đăng ký</a></p></form>`;
  return shell(register ? 'Đăng ký tài khoản' : 'Đăng nhập', [[register ? 'Đăng ký' : 'Đăng nhập']], body, tb);
}

export function lostHtml(tb: string): string {
  const body = tb === 'da-gui' ? '' : `<form method="post" action="/api/form/quen-mat-khau/" class="ns-card ns-auth"><p>Nhập email hoặc tên đăng nhập, chúng tôi sẽ gửi link tạo mật khẩu mới vào email của bạn.</p>${field('user_login', 'Email hoặc tên đăng nhập *', '', 'text', 'required autocomplete="username"')}<button type="submit" class="btn-gold ns-block">Gửi link đặt lại mật khẩu</button><p class="ns-auth-switch"><a href="/tai-khoan/">Quay lại đăng nhập</a></p></form>`;
  return shell('Quên mật khẩu', [['Tài khoản', '/tai-khoan/'], ['Quên mật khẩu']], body, tb);
}

export function resetHtml(key: string, tb: string): string {
  return shell('Đặt lại mật khẩu', [['Tài khoản', '/tai-khoan/'], ['Đặt lại mật khẩu']], `<form method="post" action="/api/form/dat-lai-mat-khau/" class="ns-card ns-auth"><input type="hidden" name="key" value="${esc(key)}">${field('password_1', 'Mật khẩu mới *', '', 'password', 'required minlength="6" autocomplete="new-password"')}${field('password_2', 'Nhập lại mật khẩu mới *', '', 'password', 'required minlength="6" autocomplete="new-password"')}<button type="submit" class="btn-gold ns-block">Lưu mật khẩu</button></form>`, tb);
}

function orderRow(o: { id: number; createdAt: Date; status: string; total: number; items: { qty: number }[] }): string {
  const [label, tone] = STATUS[o.status] || [o.status, 'mute'];
  return `<tr><td><a href="/tai-khoan/don-hang/${o.id}/" class="font-bold text-gold">${orderCode(o)}</a></td><td>${vnDate(o.createdAt)}</td><td><span class="ns-badge is-${tone}">${esc(label)}</span></td><td class="ns-num">${vnd(o.total)} <small>(${o.items.reduce((a, i) => a + i.qty, 0)} sp)</small></td><td class="ns-num"><a href="/tai-khoan/don-hang/${o.id}/" class="btn-outline ns-btn-sm">Xem</a></td></tr>`;
}

export async function accountHome(user: User, tb: string): Promise<string> {
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5, include: { items: true } });
  let body = `<p>Xin chào <strong>${esc(user.name)}</strong> (không phải bạn? <a href="/tai-khoan/dang-xuat/" class="text-gold underline">Đăng xuất</a>)</p><p class="ns-muted">Tên đăng nhập: <strong>${esc(user.login)}</strong> · Email: <strong>${esc(user.email)}</strong></p>`;
  body += `<h2 class="ns-h2">Đơn hàng gần đây</h2>${orders.length ? `<div class="ns-card ns-flush"><table class="ns-table"><thead><tr><th>Mã đơn</th><th>Ngày</th><th>Trạng thái</th><th class="ns-num">Tổng</th><th></th></tr></thead><tbody>${orders.map(orderRow).join('')}</tbody></table></div>` : `<div class="ns-empty">${ic('shopping-bag', 'size-10')}<p>Bạn chưa có đơn hàng nào.</p><a href="/cua-hang/" class="btn-gold">Mua sắm ngay</a></div>`}`;
  return accountShell('tong-quan', 'Tài khoản', body, tb);
}

export async function accountOrders(user: User): Promise<string> {
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, include: { items: true } });
  const body = orders.length ? `<div class="ns-card ns-flush"><table class="ns-table"><thead><tr><th>Mã đơn</th><th>Ngày</th><th>Trạng thái</th><th class="ns-num">Tổng</th><th></th></tr></thead><tbody>${orders.map(orderRow).join('')}</tbody></table></div>` : `<div class="ns-empty">${ic('shopping-bag', 'size-10')}<p>Bạn chưa có đơn hàng nào.</p><a href="/cua-hang/" class="btn-gold">Mua sắm ngay</a></div>`;
  return accountShell('don-hang', 'Đơn hàng', body, '', [['Tài khoản', '/tai-khoan/'], ['Đơn hàng']]);
}

export async function accountOrder(s: Settings, user: User, id: number): Promise<string | null> {
  const o = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!o || o.userId !== user.id) return null;
  let body = '';
  if (o.paymentMethod === 'bacs' && !o.paid && !['cancelled', 'completed'].includes(o.status)) body += bankBox(s, o);
  body += `<div class="ns-card">${orderTable(o)}</div>`;
  return accountShell('don-hang', `Đơn hàng ${orderCode(o)}`, body, '', [['Tài khoản', '/tai-khoan/'], ['Đơn hàng', '/tai-khoan/don-hang/'], [orderCode(o)]]);
}

export function accountInfo(user: User, tb: string): string {
  const body = `<form method="post" action="/api/form/thong-tin/" class="ns-card ns-form">
<label class="field"><span>Tên đăng nhập</span><input type="text" value="${esc(user.login)}" disabled><small class="ns-muted">Dùng tên đăng nhập hoặc email để đăng nhập. Tên đăng nhập không đổi được.</small></label>
<div class="ns-grid-2">${field('name', 'Họ và tên *', user.name, 'text', 'required')}${field('phone', 'Số điện thoại', user.phone, 'tel')}</div>
${field('email', 'Email *', user.email, 'email', 'required')}${field('address', 'Địa chỉ nhận hàng', user.address)}
<fieldset><legend>Đổi mật khẩu (để trống nếu không đổi)</legend>${field('password_current', 'Mật khẩu hiện tại', '', 'password', 'autocomplete="current-password"')}<div class="ns-grid-2">${field('password_1', 'Mật khẩu mới', '', 'password', 'autocomplete="new-password"')}${field('password_2', 'Nhập lại mật khẩu mới', '', 'password', 'autocomplete="new-password"')}</div></fieldset>
<button type="submit" class="btn-gold">Lưu thay đổi</button></form>`;
  return accountShell('thong-tin', 'Thông tin tài khoản', body, tb, [['Tài khoản', '/tai-khoan/'], ['Thông tin tài khoản']]);
}
