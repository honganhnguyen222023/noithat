import { notFound } from 'next/navigation';
import { Html } from '@/components/Html';
import { esc, stripTags } from '@/lib/html';
import { q, type SP } from '@/lib/page';
import { productHtml } from '@/lib/product';
import { getSettings } from '@/lib/settings';
import { db } from '@/lib/db';
import { FULL } from '@/lib/shop';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

const find = async (slug: string) => db.product.findFirst({ where: { slug: decodeURIComponent(slug), status: 'publish' }, include: FULL });

export async function generateMetadata({ params }: P) {
  const p = await find((await params).slug);
  return p ? { title: p.name, description: stripTags(p.short || p.content).slice(0, 160) || undefined, openGraph: { images: p.image ? [p.image] : undefined } } : {};
}

// Trang chi tiết sản phẩm.
export default async function ProductPage({ params, searchParams }: P) {
  const p = await find((await params).slug);
  if (!p) notFound();
  const sp = await searchParams;
  let notice = '';
  if (q(sp, 'da-them')) notice = `<div class="woocommerce-message" role="alert"><a href="/gio-hang/" class="button wc-forward">Xem giỏ hàng</a> “${esc(p.name)}” đã được thêm vào giỏ hàng.</div>`;
  if (q(sp, 'loi')) notice = `<ul class="woocommerce-error" role="alert"><li>${esc(q(sp, 'loi'))}</li></ul>`;
  return <Html html={await productHtml(p, await getSettings(), notice)} />;
}
