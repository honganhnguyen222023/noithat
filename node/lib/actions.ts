// Xử lý form của khách: giỏ hàng, đặt hàng, tài khoản, liên hệ. Mỗi hàm trả về link chuyển tới sau khi xong.
import { headers } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { authenticate, endOtherSessions, endSession, getCurrentUser, startSession } from './auth';
import { cartLines, readCart, saveCart } from './cart';
import { db } from './db';
import { digits } from './html';
import { sendMail } from './mail';
import { addNote, mailNewOrder, orderKey, PAYMENT_TITLES } from './orders';
import { hashPassword } from './passwords';
import { getSettings, mod } from './settings';

type F = FormData;
const str = (f: F, k: string) => String(f.get(k) ?? '').trim();
const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const enc = encodeURIComponent;

/** Chỉ cho quay lại trang trong website (không phải quản trị). */
function safeBack(v: string, def = '/tai-khoan/'): string {
  return v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/quan-tri') ? v : def;
}
async function ip(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0].trim() || h.get('x-real-ip') || '127.0.0.1';
}
const fails = new Map<string, { n: number; at: number }>();
const recent = new Map<string, number>();

async function newLogin(email: string): Promise<string> {
  let login = email.split('@')[0].replace(/[^a-z0-9._-]/gi, '') || 'khachhang';
  for (let i = 2; await db.user.findUnique({ where: { login } }); i++) login = login.replace(/\d*$/, '') + i;
  return login;
}

export const ACTIONS: Record<string, (f: F) => Promise<string>> = {
  /* ---------------- Giỏ hàng */
  async 'cap-nhat-gio'(f) {
    const rows = await readCart();
    for (const r of rows) {
      const v = f.get(`qty[${r.p}:${r.v}]`);
      if (v !== null) r.q = Math.max(0, Math.min(99, parseInt(String(v), 10) || 0));
    }
    await saveCart(rows.filter((r) => r.q > 0));
    return '/gio-hang/?tb=da-cap-nhat';
  },
  async 'xoa-khoi-gio'(f) {
    const [p, v] = str(f, 'key').split(':').map((x) => parseInt(x, 10) || 0);
    await saveCart((await readCart()).filter((r) => !(r.p === p && r.v === v)));
    return '/gio-hang/?tb=da-xoa';
  },

  /* ---------------- Đặt hàng */
  async 'dat-hang'(f) {
    const s = await getSettings();
    const lines = await cartLines();
    if (!lines.length) return '/gio-hang/';
    const name = str(f, 'name').slice(0, 100);
    const phone = str(f, 'phone').slice(0, 20);
    const email = str(f, 'email').toLowerCase().slice(0, 120);
    const address = str(f, 'address').slice(0, 300);
    const method = str(f, 'payment');
    const err = (tb: string) => `/thanh-toan/?tb=${tb}`;
    if (!name) return err('thieu-ten');
    if (digits(phone).length < 9 || digits(phone).length > 12) return err('sai-sdt');
    if (email && !isEmail(email)) return err('sai-email');
    if (!address) return err('thieu-dia-chi');
    const allowed = [s.payments.cod.enabled && 'cod', s.payments.bacs.enabled && 'bacs'].filter(Boolean);
    if (!allowed.includes(method)) return err('chon-tt');

    let user = await getCurrentUser();
    // Khách chưa đăng nhập mà tick "Tạo tài khoản".
    if (!user && f.get('create_account')) {
      const pass = String(f.get('account_password') ?? '');
      if (!isEmail(email)) return err('can-email');
      if (pass.length < 6) return err('mk-ngan');
      if (await db.user.findUnique({ where: { email } })) return err('trung-email');
      user = await db.user.create({ data: { login: await newLogin(email), email, name, phone, address, passwordHash: await hashPassword(pass) } });
      await startSession(user, true);
    }
    const subtotal = lines.reduce((a, l) => a + l.total, 0);
    const order = await db.order.create({
      data: {
        userId: user?.id ?? null, status: 'pending', subtotal, total: subtotal, paymentMethod: method, paymentTitle: s.payments[method as 'cod' | 'bacs'].title || PAYMENT_TITLES[method],
        name, phone, email: email || user?.email || '', address, note: str(f, 'note').slice(0, 1000),
        items: { create: lines.map((l) => ({ productId: l.product.id, variationId: l.variationId || null, name: l.product.name, variant: l.variant, image: l.image, price: l.price, qty: l.qty, total: l.total })) },
      },
      include: { items: true },
    });
    await addNote(order.id, `Khách đặt hàng trên website, thanh toán: ${order.paymentTitle}.`);
    if (user) await db.user.update({ where: { id: user.id }, data: { phone: user.phone || phone, address: address } });
    await saveCart([]);
    await mailNewOrder(order);
    return `/thanh-toan/da-dat/${order.id}/?key=${orderKey(order)}`;
  },

  /* ---------------- Tài khoản */
  async 'dang-nhap'(f) {
    const back = safeBack(str(f, 'redirect_to'));
    const key = await ip();
    const rec = fails.get(key);
    const qs = (tb: string) => `/tai-khoan/?tb=${tb}${back !== '/tai-khoan/' ? '&redirect_to=' + enc(back) : ''}`;
    if (rec && rec.n >= 5 && Date.now() - rec.at < 15 * 60 * 1000) return qs('khoa');
    const user = await authenticate(str(f, 'username'), String(f.get('password') ?? ''));
    if (!user) {
      fails.set(key, { n: (rec && Date.now() - rec.at < 15 * 60 * 1000 ? rec.n : 0) + 1, at: Date.now() });
      return qs('sai');
    }
    fails.delete(key);
    await startSession(user, !!f.get('rememberme'));
    if (user.role !== 'customer') await startSession(user, !!f.get('rememberme'), 'admin');
    return back;
  },
  async 'dang-ky'(f) {
    const back = safeBack(str(f, 'redirect_to'));
    const name = str(f, 'name');
    const phone = str(f, 'phone');
    const email = str(f, 'email').toLowerCase();
    const pass = String(f.get('password') ?? '');
    const err = (tb: string) => `/tai-khoan/dang-ky/?tb=${tb}${back !== '/tai-khoan/' ? '&redirect_to=' + enc(back) : ''}`;
    if (!name) return err('thieu-ten');
    if (digits(phone).length < 9 || digits(phone).length > 12) return err('sai-sdt');
    if (!isEmail(email)) return err('sai-email');
    if (pass.length < 6) return err('mk-ngan');
    if (await db.user.findUnique({ where: { email } })) return err('trung-email');
    const user = await db.user.create({ data: { login: await newLogin(email), email, name, phone, passwordHash: await hashPassword(pass) } });
    await startSession(user, true);
    return back;
  },
  async 'dang-xuat'() {
    await endSession();
    return '/';
  },
  async 'quen-mat-khau'(f) {
    const login = str(f, 'user_login');
    const k = login.toLowerCase();
    if (login && Date.now() - (recent.get(k) || 0) > 2 * 60 * 1000) {
      recent.set(k, Date.now());
      const user = await db.user.findFirst({ where: { OR: [{ email: k }, { login }] } });
      if (user) {
        const id = randomBytes(24).toString('hex');
        await db.passwordReset.deleteMany({ where: { userId: user.id } });
        await db.passwordReset.create({ data: { id, userId: user.id, expiresAt: new Date(Date.now() + 3600 * 1000) } });
        const s = await getSettings();
        const site = process.env.SITE_URL || 'http://localhost:3000';
        await sendMail(user.email, `[${mod(s, 'site_name')}] Đặt lại mật khẩu`, `Chào ${user.name},\n\nBấm vào link sau để đặt mật khẩu mới (hiệu lực 1 giờ):\n${site}/tai-khoan/dat-lai-mat-khau/?key=${id}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này.`);
      }
    }
    return '/tai-khoan/quen-mat-khau/?tb=da-gui';
  },
  async 'dat-lai-mat-khau'(f) {
    const key = str(f, 'key');
    const p1 = String(f.get('password_1') ?? '');
    const r = await db.passwordReset.findUnique({ where: { id: key } });
    if (!r || r.expiresAt.getTime() < Date.now()) return '/tai-khoan/quen-mat-khau/?tb=het-han';
    if (p1.length < 6) return `/tai-khoan/dat-lai-mat-khau/?key=${key}&tb=mk-ngan`;
    if (p1 !== String(f.get('password_2') ?? '')) return `/tai-khoan/dat-lai-mat-khau/?key=${key}&tb=mk-khac`;
    await db.user.update({ where: { id: r.userId }, data: { passwordHash: await hashPassword(p1) } });
    await db.passwordReset.deleteMany({ where: { userId: r.userId } });
    await db.session.deleteMany({ where: { userId: r.userId } });
    return '/tai-khoan/?tb=da-doi-mk';
  },
  async 'thong-tin'(f) {
    const user = await getCurrentUser();
    if (!user) return '/tai-khoan/';
    const name = str(f, 'name');
    const email = str(f, 'email').toLowerCase();
    const err = (tb: string) => `/tai-khoan/thong-tin/?tb=${tb}`;
    if (!name) return err('thieu-ten');
    if (!isEmail(email)) return err('sai-email');
    const other = await db.user.findUnique({ where: { email } });
    if (other && other.id !== user.id) return err('trung-email');
    const data: Record<string, string> = { name, email, phone: str(f, 'phone'), address: str(f, 'address') };
    const cur = String(f.get('password_current') ?? '');
    const p1 = String(f.get('password_1') ?? '');
    const p2 = String(f.get('password_2') ?? '');
    if (cur || p1 || p2) {
      if (!(await authenticate(user.email, cur))) return err('sai-mk-cu');
      if (p1.length < 6) return err('mk-ngan');
      if (p1 !== p2) return err('mk-khac');
      data.passwordHash = await hashPassword(p1);
    }
    await db.user.update({ where: { id: user.id }, data });
    if (data.passwordHash) await endOtherSessions(user.id, 'site');
    return err('da-luu');
  },

  /* ---------------- Liên hệ (giống inc/contact-form.php) */
  async 'lien-he'(f) {
    const back = safeBack(str(f, 'back'), '/lien-he/');
    const go = (st: string) => `${back.split('#')[0].replace(/[?&]lien-he=\w+/, '')}${back.includes('?') ? '&' : '?'}lien-he=${st}#lien-he-form`;
    if (str(f, 'website')) return go('loi');
    const name = str(f, 'name').slice(0, 100);
    const phone = str(f, 'phone').slice(0, 20);
    const email = str(f, 'email').slice(0, 120);
    const message = str(f, 'message').slice(0, 3000);
    const source = str(f, 'source').slice(0, 120);
    if (!name || (digits(phone).length < 9 && !isEmail(email))) return go('loi');
    await db.contact.create({ data: { name, phone, email, message, source } });
    const s = await getSettings();
    const to = mod(s, 'notify_email') || mod(s, 'email');
    const site = process.env.SITE_URL || 'http://localhost:3000';
    if (to) await sendMail(to, `[Website] Tin nhắn mới từ ${name}`, `Họ tên: ${name}\nĐiện thoại: ${phone}\nEmail: ${email}\nTrang: ${source}\n\n${message}\n\nXem trong quản trị: ${site}/quan-tri/lien-he/`);
    return go('ok');
  },
};
