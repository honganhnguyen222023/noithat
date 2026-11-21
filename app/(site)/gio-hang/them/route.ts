import { NextResponse } from 'next/server';
import { cartCount, readCart, saveCart } from '@/lib/cart';
import { db } from '@/lib/db';
import { active, productUrl } from '@/lib/shop';

// Thêm vào giỏ: form trang sản phẩm (POST), nút trên thẻ sản phẩm (POST ?ajax=1) hoặc link (GET ?sp=).
async function add(productId: number, variationId: number, qty: number): Promise<{ ok: boolean; msg: string; slug?: string }> {
  const p = await db.product.findFirst({ where: { id: productId, status: 'publish' }, include: { variations: true } });
  if (!p) return { ok: false, msg: 'Sản phẩm không còn bán.' };
  if (p.type === 'variable') {
    const v = p.variations.find((x) => x.id === variationId);
    if (!v) return { ok: false, msg: 'Vui lòng chọn mẫu sản phẩm.', slug: p.slug };
    if (v.stock !== 'instock' || active(v.regularPrice, v.salePrice) === null) return { ok: false, msg: 'Mẫu này đang hết hàng.', slug: p.slug };
  } else if (p.stock !== 'instock' || active(p.regularPrice, p.salePrice) === null) return { ok: false, msg: 'Sản phẩm đang hết hàng.', slug: p.slug };
  await saveCart([...(await readCart()), { p: p.id, v: p.type === 'variable' ? variationId : 0, q: Math.max(1, Math.min(99, qty || 1)) }]);
  return { ok: true, msg: 'Đã thêm vào giỏ hàng.', slug: p.slug };
}

const site = (req: Request) => process.env.SITE_URL || new URL(req.url).origin;

export async function POST(req: Request) {
  const f = await req.formData();
  const r = await add(parseInt(String(f.get('product')), 10), parseInt(String(f.get('variation_id') || '0'), 10) || 0, parseInt(String(f.get('quantity') || '1'), 10));
  if (new URL(req.url).searchParams.get('ajax')) return Response.json({ ...r, count: await cartCount() });
  const back = r.slug ? productUrl({ slug: r.slug }) : '/cua-hang/';
  if (!r.ok) return NextResponse.redirect(new URL(`${back}?loi=${encodeURIComponent(r.msg)}`, site(req)), 303);
  return NextResponse.redirect(new URL(f.get('buy_now') ? '/thanh-toan/' : `${back}?da-them=1`, site(req)), 303);
}

export async function GET(req: Request) {
  const u = new URL(req.url);
  const r = await add(parseInt(u.searchParams.get('sp') || '0', 10), parseInt(u.searchParams.get('mau') || '0', 10), 1);
  return NextResponse.redirect(new URL(r.ok ? '/gio-hang/' : r.slug ? productUrl({ slug: r.slug }) : '/cua-hang/', site(req)), 303);
}
