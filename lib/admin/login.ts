// Trang đăng nhập / quên mật khẩu riêng của quản trị (viết lại từ inc/quantri/login.php).
import { authenticate, isStaff, startSession } from '../auth';
import { db } from '../db';
import { esc } from '../html';
import { icon } from '../icons';
import { sendMail } from '../mail';
import { randomBytes } from 'node:crypto';
import { getSettings, mod, type Settings } from '../settings';
import { field, formFields, qi } from './ui';

const TRIES = 5;
const WINDOW = 15 * 60 * 1000;
const fails = new Map<string, { n: number; at: number }>();
const lost = new Map<string, number>();

/** Link quay lại sau đăng nhập: chỉ nhận trang trong /quan-tri/. */
function back(v: string): string {
  return v.startsWith('/quan-tri/') && !v.startsWith('/quan-tri/dang-nhap') ? v : '/quan-tri/';
}

export async function qtLogin(f: FormData, req: Request): Promise<string> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const login = String(f.get('log') || '').trim();
  const to = back(String(f.get('quay-lai') || ''));
  const err = (m: string) => `/quan-tri/dang-nhap/?loi=${encodeURIComponent(m)}&log=${encodeURIComponent(login)}&quay-lai=${encodeURIComponent(to)}`;
  const rec = fails.get(ip);
  const n = rec && Date.now() - rec.at < WINDOW ? rec.n : 0;
  if (n >= TRIES) return err('Bạn đã nhập sai nhiều lần. Vui lòng thử lại sau 15 phút hoặc bấm "Quên mật khẩu".');
  const pass = String(f.get('pwd') || '');
  if (!login || !pass) return err('Vui lòng nhập email (hoặc tên đăng nhập) và mật khẩu.');
  const user = await authenticate(login, pass);
  if (!user) {
    fails.set(ip, { n: n + 1, at: Date.now() });
    const left = TRIES - n - 1;
    return err('Email/tên đăng nhập hoặc mật khẩu chưa đúng.' + (left > 0 && left < 3 ? ` Còn ${left} lần thử.` : ''));
  }
  if (!isStaff(user)) return err('Tài khoản này là tài khoản khách hàng, không vào được trang quản trị. Vui lòng đăng nhập bằng tài khoản quản trị.');
  fails.delete(ip);
  await startSession(user, !!f.get('rememberme'), 'admin');
  return to;
}

export async function qtLostPassword(f: FormData): Promise<string> {
  const login = String(f.get('log') || '').trim();
  if (!login) return '/quan-tri/quen-mat-khau/?loi=' + encodeURIComponent('Vui lòng nhập email hoặc tên đăng nhập.');
  const key = login.toLowerCase();
  if (Date.now() - (lost.get(key) || 0) > 2 * 60 * 1000) {
    lost.set(key, Date.now());
    const user = await db.user.findFirst({ where: { OR: [{ email: key }, { login }] } });
    if (user) {
      const id = randomBytes(24).toString('hex');
      await db.passwordReset.deleteMany({ where: { userId: user.id } });
      await db.passwordReset.create({ data: { id, userId: user.id, expiresAt: new Date(Date.now() + 3600 * 1000) } });
      const s = await getSettings();
      const site = process.env.SITE_URL || 'http://localhost:3000';
      await sendMail(user.email, `[${mod(s, 'site_name')}] Đặt lại mật khẩu`, `Chào ${user.name},\n\nBấm vào link sau để đặt mật khẩu mới (hiệu lực 1 giờ):\n${site}/tai-khoan/dat-lai-mat-khau/?key=${id}`);
    }
  }
  return '/quan-tri/quen-mat-khau/?da-gui=1';
}

/** HTML trang đăng nhập / quên mật khẩu. */
export function authPage(s: Settings, kind: 'dang-nhap' | 'quen-mat-khau', q: Record<string, string>): string {
  const brand = mod(s, 'site_name');
  const logo = mod(s, 'custom_logo');
  let msg = q.loi || '';
  let ok = false;
  if (q['da-dang-xuat']) [msg, ok] = ['Bạn đã đăng xuất.', true];
  if (q['da-gui']) [msg, ok] = ['Nếu thông tin bạn nhập có tài khoản, chúng tôi đã gửi email kèm link đặt lại mật khẩu. Kiểm tra cả hộp thư Spam/Quảng cáo nhé.', true];
  const note = msg ? `<div class="qt-flash ${ok ? 'is-ok' : 'is-err'}" role="${ok ? 'status' : 'alert'}">${qi(ok ? 'circle-check' : 'alert-circle')}<span>${esc(msg)}</span></div>` : '';
  const to = back(q['quay-lai'] || '');
  const hid = `<input type="hidden" name="quay-lai" value="${esc(to)}">`;
  let form: string;
  if (kind === 'dang-nhap') {
    form = `<h1>Đăng nhập quản trị</h1><p class="qt-muted">Quản lý đơn hàng, sản phẩm và nội dung website.</p>${note}<form method="post" class="qt-form" action="/quan-tri/xu-ly/">${formFields('login')}${hid}`;
    form += field('log', 'Email hoặc tên đăng nhập', q.log || '', { required: true, attrs: `autocomplete="username" autocapitalize="off" spellcheck="false"${q.log ? '' : ' autofocus'}` });
    form += `<div class="qt-field"><div class="qt-label-row"><label for="f-pwd">Mật khẩu</label><a href="/quan-tri/quen-mat-khau/">Quên mật khẩu?</a></div><div class="qt-pass"><input type="password" id="f-pwd" name="pwd" required autocomplete="current-password"${q.log ? ' autofocus' : ''}><button type="button" class="qt-icon-btn" data-qt-pass aria-label="Hiện mật khẩu" title="Hiện mật khẩu">${qi('eye', 18)}</button></div></div>`;
    form += field('rememberme', 'Ghi nhớ đăng nhập trên máy này', true, { type: 'checkbox' });
    form += `<button class="qt-btn qt-btn-block" type="submit">${qi('log-in', 18)} Đăng nhập</button></form>`;
  } else {
    form = `<h1>Quên mật khẩu</h1><p class="qt-muted">Nhập email hoặc tên đăng nhập, chúng tôi sẽ gửi link để bạn đặt mật khẩu mới.</p>${note}`;
    if (!ok) form += `<form method="post" class="qt-form" action="/quan-tri/xu-ly/">${formFields('lost')}${field('log', 'Email hoặc tên đăng nhập', '', { required: true, attrs: 'autocomplete="username" autocapitalize="off" spellcheck="false" autofocus' })}<button class="qt-btn qt-btn-block" type="submit">${qi('mail', 18)} Gửi link đặt lại mật khẩu</button></form>`;
    form += `<p class="qt-auth-alt"><a href="/quan-tri/dang-nhap/">${qi('arrow-left', 16)} Quay lại đăng nhập</a></p>`;
  }
  const li = (t: string) => `<li>${icon('check-circle-2', 'qt-ico', 18)} ${t}</li>`;
  return `<div class="qt-auth"><aside class="qt-auth-side"><a class="qt-brand" href="/">${logo ? `<img class="qt-logo-img" src="${esc(logo)}" alt="">` : `<span class="qt-logo">${esc(brand.replace(/^Nội Thất\s*/i, '').charAt(0) || 'I')}</span>`}<span><strong>${esc(brand)}</strong><small>${esc(mod(s, 'site_tagline'))}</small></span></a>
<div class="qt-auth-pitch"><h2>Quản lý cửa hàng nội thất gọn trong một nơi</h2><ul>${li('Xác nhận đơn hàng, theo dõi giao hàng')}${li('Thêm sản phẩm, mẫu màu, giá khuyến mãi')}${li('Sửa nội dung trang chủ ngay trên điện thoại')}</ul></div>
<p class="qt-auth-foot"><a href="/">${qi('arrow-left', 15)} Về trang chủ website</a></p></aside><main class="qt-auth-main"><div class="qt-auth-card">${form}</div></main></div>`;
}
