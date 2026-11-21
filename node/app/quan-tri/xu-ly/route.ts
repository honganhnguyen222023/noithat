// Nhận form trong trang quản trị: kiểm tra nguồn gửi + quyền, chạy thao tác, quay lại kèm thông báo.
import { NextResponse } from 'next/server';
import { ACTIONS } from '@/lib/admin/actions';
import { qtLogin, qtLostPassword } from '@/lib/admin/login';
import { canSection } from '@/lib/admin/ui';
import { getAdminUser, isStaff } from '@/lib/auth';

// Thao tác → mục quản trị cần quyền.
const NEED: Record<string, string> = { settings_save: 'cai-dat', content_save: 'noi-dung', menu_save: 'menu', staff_save: 'cai-dat' };

export async function POST(req: Request) {
  const site = process.env.SITE_URL || new URL(req.url).origin;
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host && origin !== process.env.SITE_URL) return new Response('Yêu cầu không hợp lệ.', { status: 403 });
  const f = await req.formData();
  const act = String(f.get('kh_qt_do') || '');
  const go = (url: string) => NextResponse.redirect(new URL(url, site), 303);

  if (act === 'login') return go(await qtLogin(f, req));
  if (act === 'lost') return go(await qtLostPassword(f));

  const me = await getAdminUser();
  if (!me || !isStaff(me)) return go('/quan-tri/dang-nhap/');
  const fn = ACTIONS[act];
  if (!fn || (NEED[act] && !canSection(me, NEED[act]))) return go('/quan-tri/?tb=' + encodeURIComponent('Bạn không có quyền làm thao tác này.') + '&ok=0');
  const r = await fn(f, me);
  // Quay lại trang vừa đứng (hoặc trang thao tác chỉ định), kèm thông báo.
  const ref = req.headers.get('referer');
  let back = r.go || '/quan-tri/';
  if (!r.go && ref) {
    const u = new URL(ref);
    if (u.host === new URL(site).host && u.pathname.startsWith('/quan-tri')) back = u.pathname + u.search;
  }
  const u = new URL(back, site);
  u.searchParams.set('tb', r.msg);
  u.searchParams.set('ok', r.ok ? '1' : '0');
  return go(u.pathname + u.search);
}
