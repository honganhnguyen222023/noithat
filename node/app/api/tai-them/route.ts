import { getAttributes, latestProducts, productCard } from '@/lib/shop';

// Nút "Tải thêm" ở trang chủ (thay cho admin-ajax.php?action=iris_more).
export async function GET(req: Request) {
  const u = new URL(req.url);
  const cat = u.searchParams.get('cat') || '';
  const page = Math.max(2, parseInt(u.searchParams.get('page') || '2', 10) || 2);
  const limit = Math.min(24, Math.max(1, parseInt(u.searchParams.get('limit') || '4', 10) || 4));
  const [items, next, attrs] = await Promise.all([latestProducts(cat, limit, page), latestProducts(cat, limit, page + 1), getAttributes()]);
  return Response.json({ html: items.map((p) => productCard(p, attrs)).join(''), more: next.length > 0 });
}
