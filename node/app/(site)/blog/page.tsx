import { Html } from '@/components/Html';
import { q, type SP } from '@/lib/page';
import { blogListHtml } from '@/lib/pages';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Blog kiến thức' };

export default async function Blog({ searchParams }: { searchParams: Promise<SP> }) {
  return <Html html={await blogListHtml(null, Math.max(1, parseInt(q(await searchParams, 'trang'), 10) || 1))} />;
}
