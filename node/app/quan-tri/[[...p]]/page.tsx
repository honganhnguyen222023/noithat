import { notFound, redirect } from 'next/navigation';
import { Html } from '@/components/Html';
import { authPage } from '@/lib/admin/login';
import { pageAccount, pageContacts, pageContent, pageMenu, pagePages, pagePosts, pageSettings, pageTestimonials } from '@/lib/admin/pages-content';
import { pageCustomers, pageDashboard, pageOrders } from '@/lib/admin/pages-orders';
import { pageAttributes, pageCategories, pageProducts } from '@/lib/admin/pages-products';
import { adminShell, type AdminPage, canSection, denied, SECTIONS } from '@/lib/admin/ui';
import { getAdminUser } from '@/lib/auth';
import { flat, type SP } from '@/lib/page';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ p?: string[] }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: P) {
  const sec = (await params).p?.[0] || 'tong-quan';
  return { title: sec === 'dang-nhap' ? 'Đăng nhập quản trị' : `${SECTIONS[sec]?.label || 'Quản trị'} · Quản trị` };
}

export default async function Admin({ params, searchParams }: P) {
  const p = (await params).p || [];
  const q = flat(await searchParams);
  const s = await getSettings();
  const user = await getAdminUser();
  const section = p[0] || 'tong-quan';
  const id = p[1] || '';

  if (section === 'dang-nhap' || section === 'quen-mat-khau') {
    if (user) redirect('/quan-tri/');
    return (
      <div className="qt-auth-body">
        <Html html={authPage(s, section, q)} />
      </div>
    );
  }
  if (!user) redirect(`/quan-tri/dang-nhap/?quay-lai=${encodeURIComponent('/quan-tri/' + p.map((x) => x + '/').join(''))}`);
  if (!SECTIONS[section]) notFound();

  let page: AdminPage;
  if (!canSection(user, section)) page = denied();
  else if (section === 'tong-quan') page = await pageDashboard(user);
  else if (section === 'don-hang') page = await pageOrders(id, q);
  else if (section === 'khach-hang') page = await pageCustomers(id, q);
  else if (section === 'san-pham') page = await pageProducts(id, q);
  else if (section === 'danh-muc') page = await pageCategories(id);
  else if (section === 'thuoc-tinh') page = await pageAttributes();
  else if (section === 'bai-viet') page = await pagePosts(id, q);
  else if (section === 'trang') page = await pagePages(id);
  else if (section === 'phan-hoi') page = await pageTestimonials(id);
  else if (section === 'lien-he') page = await pageContacts(q);
  else if (section === 'noi-dung') page = await pageContent(q);
  else if (section === 'menu') page = await pageMenu();
  else if (section === 'cai-dat') page = await pageSettings(q);
  else page = pageAccount(user);

  const flash = q.tb ? { msg: q.tb.slice(0, 600), ok: q.ok !== '0' } : null;
  return <Html html={await adminShell(s, user, section, page, flash)} />;
}
