// Đơn hàng: trạng thái, mã xem đơn, ghi chú, email báo, mã QR chuyển khoản, bảng chi tiết đơn.
import type { Order, OrderItem } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { db } from './db';
import { esc, vnDate } from './html';
import { sendMail } from './mail';
import { type BankAccount, getSettings, mod, type Settings } from './settings';
import { money, vnd } from './shop';

/** Trạng thái: [chữ, màu nhãn]. */
export const STATUS: Record<string, [string, string]> = {
  pending: ['Chờ xác nhận', 'warn'],
  processing: ['Đã xác nhận', 'info'],
  shipping: ['Đang giao hàng', 'info'],
  completed: ['Hoàn thành', 'ok'],
  cancelled: ['Đã hủy', 'mute'],
};
export const PAYMENT_TITLES: Record<string, string> = { cod: 'Thanh toán khi nhận hàng (COD)', bacs: 'Chuyển khoản ngân hàng' };

/** Mã bí mật để khách xem đơn vừa đặt mà không cần đăng nhập. */
export function orderKey(o: Pick<Order, 'id' | 'createdAt'>): string {
  return createHmac('sha256', process.env.APP_SECRET || 'noithat-iris').update(`${o.id}:${o.createdAt.getTime()}`).digest('hex').slice(0, 16);
}

export async function addNote(orderId: number, content: string, author = 'system') {
  await db.orderNote.create({ data: { orderId, content, author } });
}

export function orderCode(o: Pick<Order, 'id'>): string {
  return 'DH' + o.id;
}

/* ---------------------------------------------------------------- QR chuyển khoản (VietQR) */

const BANK_BIN: Record<string, string> = {
  vietcombank: '970436', vcb: '970436', vietinbank: '970415', bidv: '970418', agribank: '970405', techcombank: '970407', tcb: '970407',
  mbbank: '970422', mb: '970422', acb: '970416', vpbank: '970432', tpbank: '970423', sacombank: '970403', hdbank: '970437', vib: '970441',
  shb: '970443', ocb: '970448', msb: '970426', seabank: '970440', eximbank: '970431', lpbank: '970449', namabank: '970428', bacabank: '970409',
};

export function vietQr(acc: BankAccount, amount: number, info: string): string {
  const key = acc.bank.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '').replace(/^nganhang/, '');
  const bin = BANK_BIN[key] || Object.entries(BANK_BIN).find(([k]) => key.includes(k))?.[1];
  const no = acc.number.replace(/\s/g, '');
  if (!bin || !no) return '';
  return `https://img.vietqr.io/image/${bin}-${encodeURIComponent(no)}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(info)}&accountName=${encodeURIComponent(acc.name)}`;
}

/** Khung hướng dẫn chuyển khoản + mã QR. */
export function bankBox(s: Settings, o: Pick<Order, 'id' | 'total'>): string {
  const b = s.payments.bacs;
  const accs = b.accounts.filter((a) => a.number);
  let out = `<section class="ns-bank"><h2>Thông tin chuyển khoản</h2>${b.instructions ? `<p>${esc(b.instructions)}</p>` : ''}`;
  if (!accs.length) return out + '<p class="ns-muted">Cửa hàng sẽ gọi điện báo số tài khoản cho bạn.</p></section>';
  for (const a of accs) {
    const qr = vietQr(a, o.total, orderCode(o));
    out += `<div class="ns-bank-acc">${qr ? `<img src="${esc(qr)}" alt="Mã QR chuyển khoản" width="220" loading="lazy">` : ''}<dl><dt>Ngân hàng</dt><dd>${esc(a.bank)}</dd><dt>Số tài khoản</dt><dd><strong>${esc(a.number)}</strong></dd><dt>Chủ tài khoản</dt><dd>${esc(a.name)}</dd><dt>Số tiền</dt><dd><strong>${vnd(o.total)}</strong></dd><dt>Nội dung</dt><dd><strong>${orderCode(o)}</strong></dd></dl></div>`;
  }
  return out + '</section>';
}

/* ---------------------------------------------------------------- Bảng chi tiết đơn */

export function orderTable(o: Order & { items: OrderItem[] }): string {
  const [label] = STATUS[o.status] || [o.status];
  let out = `<ul class="ns-order-overview"><li>Mã đơn hàng:<strong>${orderCode(o)}</strong></li><li>Ngày đặt:<strong>${vnDate(o.createdAt, true)}</strong></li><li>Tổng cộng:<strong>${vnd(o.total)}</strong></li><li>Thanh toán:<strong>${esc(o.paymentTitle)}</strong></li><li>Trạng thái:<strong>${esc(label)}</strong></li></ul>`;
  out += '<table class="ns-table"><thead><tr><th>Sản phẩm</th><th class="ns-num">Tạm tính</th></tr></thead><tbody>';
  for (const it of o.items) out += `<tr><td><div class="ns-line">${it.image ? `<img src="${esc(it.image)}" alt="" width="56" height="56" loading="lazy">` : ''}<div><strong>${esc(it.name)}</strong> × ${it.qty}${it.variant ? `<small>${esc(it.variant)}</small>` : ''}</div></div></td><td class="ns-num">${money(it.total)}</td></tr>`;
  out += `</tbody><tfoot><tr><th>Tạm tính</th><td class="ns-num">${money(o.subtotal)}</td></tr><tr><th>Giao hàng</th><td class="ns-num">${o.shipping ? money(o.shipping) : 'Liên hệ báo phí'}</td></tr><tr class="ns-total"><th>Tổng cộng</th><td class="ns-num">${money(o.total)}</td></tr></tfoot></table>`;
  out += `<section class="ns-address"><h2>Thông tin nhận hàng</h2><p><strong>${esc(o.name)}</strong><br>${esc(o.phone)}${o.email ? '<br>' + esc(o.email) : ''}<br>${esc(o.address)}</p>${o.note ? `<p><em>Ghi chú: ${esc(o.note)}</em></p>` : ''}</section>`;
  return out;
}

/** Email báo đơn mới: cho cửa hàng + cho khách (nếu có email). */
export async function mailNewOrder(o: Order & { items: OrderItem[] }) {
  const s = await getSettings();
  const site = process.env.SITE_URL || 'http://localhost:3000';
  const lines = o.items.map((it) => `- ${it.name}${it.variant ? ` (${it.variant})` : ''} × ${it.qty}: ${vnd(it.total)}`).join('\n');
  const body = `Mã đơn: ${orderCode(o)}\nKhách: ${o.name} – ${o.phone}${o.email ? ' – ' + o.email : ''}\nĐịa chỉ: ${o.address}\nThanh toán: ${o.paymentTitle}\n\n${lines}\n\nTổng cộng: ${vnd(o.total)}${o.note ? `\nGhi chú: ${o.note}` : ''}`;
  const shop = mod(s, 'notify_email') || mod(s, 'email');
  if (shop) await sendMail(shop, `[${mod(s, 'site_name')}] Đơn hàng mới ${orderCode(o)}`, `${body}\n\nXem trong quản trị: ${site}/quan-tri/don-hang/${o.id}/`);
  if (o.email) await sendMail(o.email, `[${mod(s, 'site_name')}] Đã nhận đơn hàng ${orderCode(o)}`, `Chào ${o.name},\n\nCảm ơn bạn đã đặt hàng. Chúng tôi sẽ gọi điện xác nhận đơn sớm nhất.\n\n${body}\n\nXem đơn hàng: ${site}/thanh-toan/da-dat/${o.id}/?key=${orderKey(o)}\nHotline: ${mod(s, 'hotline')}`);
}
