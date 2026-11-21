import { notFound } from 'next/navigation';
import { Html } from '@/components/Html';
import { catalogHtml } from '@/lib/catalog';
import { stripTags } from '@/lib/html';
import { flat, type SP } from '@/lib/page';
import { getCategories } from '@/lib/shop';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

async function find(slug: string) {
  return (await getCategories()).find((c) => c.slug === decodeURIComponent(slug));
}

export async function generateMetadata({ params }: P) {
  const c = await find((await params).slug);
  return c ? { title: c.name, description: stripTags(c.bannerText || c.description).slice(0, 160) || undefined } : {};
}

// Trang danh mục sản phẩm.
export default async function CategoryPage({ params, searchParams }: P) {
  const c = await find((await params).slug);
  if (!c) notFound();
  return <Html html={await catalogHtml(c, flat(await searchParams))} />;
}
