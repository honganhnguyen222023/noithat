import { redirect } from 'next/navigation';
import { Html } from '@/components/Html';
import { getCurrentUser } from '@/lib/auth';
import { q, type SP } from '@/lib/page';
import { getSettings } from '@/lib/settings';
import { checkoutHtml } from '@/lib/shop-pages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Thanh toán', robots: { index: false } };

export default async function Checkout({ searchParams }: { searchParams: Promise<SP> }) {
  const html = await checkoutHtml(await getSettings(), await getCurrentUser(), q(await searchParams, 'tb'));
  if (!html) redirect('/gio-hang/');
  return <Html html={html} />;
}
