import { notFound, redirect } from 'next/navigation';
import { Html } from '@/components/Html';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { q, type SP } from '@/lib/page';
import { getSettings } from '@/lib/settings';
import { accountHome, accountInfo, accountOrder, accountOrders, loginHtml, lostHtml, resetHtml } from '@/lib/shop-pages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Tài khoản', robots: { index: false } };

// /tai-khoan/ (đăng nhập hoặc tổng quan), /dang-ky/, /quen-mat-khau/, /dat-lai-mat-khau/, /don-hang/[id]/, /thong-tin/
export default async function Account({ params, searchParams }: { params: Promise<{ p?: string[] }>; searchParams: Promise<SP> }) {
  const p = (await params).p || [];
  const sp = await searchParams;
  const tb = q(sp, 'tb');
  const back = q(sp, 'redirect_to');
  const user = await getCurrentUser();
  const sub = p[0] || '';
  let html: string | null;

  if (sub === 'quen-mat-khau') html = lostHtml(tb);
  else if (sub === 'dat-lai-mat-khau') {
    const key = q(sp, 'key');
    const r = key ? await db.passwordReset.findUnique({ where: { id: key } }) : null;
    if (!r || r.expiresAt.getTime() < Date.now()) redirect('/tai-khoan/quen-mat-khau/?tb=het-han');
    html = resetHtml(key, tb);
  } else if (!user) {
    if (sub && sub !== 'dang-ky') redirect('/tai-khoan/?redirect_to=' + encodeURIComponent(`/tai-khoan/${p.join('/')}/`));
    html = loginHtml(tb, back, sub === 'dang-ky');
  } else if (sub === 'dang-ky') redirect('/tai-khoan/');
  else if (sub === 'don-hang' && p[1]) html = await accountOrder(await getSettings(), user, parseInt(p[1], 10));
  else if (sub === 'don-hang') html = await accountOrders(user);
  else if (sub === 'thong-tin') html = accountInfo(user, tb);
  else if (!sub) html = await accountHome(user, tb);
  else html = null;

  if (!html) notFound();
  return <Html html={html} />;
}
