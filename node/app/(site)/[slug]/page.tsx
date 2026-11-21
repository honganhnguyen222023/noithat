import { notFound } from 'next/navigation';
import { Html } from '@/components/Html';
import { db } from '@/lib/db';
import { stripTags } from '@/lib/html';
import { q, type SP } from '@/lib/page';
import { aboutHtml, contactPageHtml, pageHtml, postHtml } from '@/lib/pages';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
type P = { params: Promise<{ slug: string }>; searchParams: Promise<SP> };

// /<slug>/: trang (Giới thiệu, Liên hệ, chính sách…) hoặc bài viết blog – giống đường dẫn WordPress.
async function find(raw: string) {
  const slug = decodeURIComponent(raw);
  const page = await db.page.findFirst({ where: { slug, status: 'publish' } });
  if (page) return { page };
  const post = await db.post.findFirst({ where: { slug, status: 'publish' }, include: { categories: { include: { category: true } } } });
  return post ? { post } : null;
}

export async function generateMetadata({ params }: P) {
  const r = await find((await params).slug);
  if (r?.page) return { title: r.page.title, description: stripTags(r.page.content).slice(0, 160) || undefined };
  if (r?.post) return { title: r.post.title, description: (r.post.excerpt || stripTags(r.post.content)).slice(0, 160), openGraph: { type: 'article', images: r.post.image ? [r.post.image] : undefined } };
  return {};
}

export default async function SlugPage({ params, searchParams }: P) {
  const r = await find((await params).slug);
  if (!r) notFound();
  if (r.post) return <Html html={await postHtml(r.post)} />;
  const p = r.page!;
  const s = await getSettings();
  if (p.template === 'about') return <Html html={await aboutHtml(p, s)} />;
  if (p.template === 'contact') return <Html html={contactPageHtml(p, s, q(await searchParams, 'lien-he'))} />;
  return <Html html={pageHtml(p)} />;
}
