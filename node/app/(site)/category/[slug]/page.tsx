import { notFound } from 'next/navigation';
import { Html } from '@/components/Html';
import { db } from '@/lib/db';
import { q, type SP } from '@/lib/page';
import { blogListHtml } from '@/lib/pages';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

export async function generateMetadata({ params }: P) {
  const c = await db.blogCategory.findUnique({ where: { slug: decodeURIComponent((await params).slug) } });
  return c ? { title: c.name } : {};
}

// Chuyên mục blog.
export default async function BlogCategoryPage({ params, searchParams }: P) {
  const c = await db.blogCategory.findUnique({ where: { slug: decodeURIComponent((await params).slug) } });
  if (!c) notFound();
  return <Html html={await blogListHtml(c, Math.max(1, parseInt(q(await searchParams, 'trang'), 10) || 1))} />;
}
