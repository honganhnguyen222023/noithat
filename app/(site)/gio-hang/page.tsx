import { Html } from '@/components/Html';
import { q, type SP } from '@/lib/page';
import { cartHtml } from '@/lib/shop-pages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Giỏ hàng', robots: { index: false } };

export default async function Cart({ searchParams }: { searchParams: Promise<SP> }) {
  return <Html html={await cartHtml(q(await searchParams, 'tb'))} />;
}
