import { Html } from '@/components/Html';
import { catalogHtml } from '@/lib/catalog';
import { flat, type SP } from '@/lib/page';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }) {
  const s = flat(await searchParams).s;
  return { title: s ? `Tìm kiếm: ${s}` : 'Sản phẩm' };
}

// Trang cửa hàng (tất cả sản phẩm, tìm kiếm ?s=).
export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  return <Html html={await catalogHtml(null, flat(await searchParams))} />;
}
