import { notFound } from 'next/navigation';
import { Html } from '@/components/Html';
import { getCurrentUser } from '@/lib/auth';
import { q, type SP } from '@/lib/page';
import { getSettings } from '@/lib/settings';
import { thankYouHtml } from '@/lib/shop-pages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Đặt hàng thành công', robots: { index: false } };

export default async function Done({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const html = await thankYouHtml(await getSettings(), parseInt((await params).id, 10), q(await searchParams, 'key'), await getCurrentUser());
  if (!html) notFound();
  return <Html html={html} />;
}
