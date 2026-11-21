// Giỏ hàng: lưu trong cookie "iris_cart" dạng "sp:mẫu:số-lượng|…" (không cần đăng nhập).
import { cookies } from 'next/headers';
import { db } from './db';
import { active, type AttrFull, FULL, type FullProduct, getAttributes, variantLabel } from './shop';

export const CART_COOKIE = 'iris_cart';
export type CartRow = { p: number; v: number; q: number };
export type CartLine = { key: string; product: FullProduct; variationId: number; variant: string; image: string; price: number; qty: number; total: number };

export async function readCart(): Promise<CartRow[]> {
  const raw = (await cookies()).get(CART_COOKIE)?.value || '';
  return raw.split('|').map((x) => x.split(':').map((n) => parseInt(n, 10) || 0)).filter(([p, , q]) => p > 0 && q > 0).map(([p, v, q]) => ({ p, v, q: Math.min(q, 99) }));
}

export async function saveCart(rows: CartRow[]) {
  const merged: CartRow[] = [];
  for (const r of rows) {
    const same = merged.find((m) => m.p === r.p && m.v === r.v);
    if (same) same.q = Math.min(99, same.q + r.q);
    else if (r.q > 0) merged.push({ ...r });
  }
  (await cookies()).set(CART_COOKIE, merged.map((r) => `${r.p}:${r.v}:${r.q}`).join('|'), { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 });
}

export async function cartCount(): Promise<number> {
  return (await readCart()).reduce((a, r) => a + r.q, 0);
}

/** Dòng trong giỏ, đã kiểm tra sản phẩm còn bán và tính tiền. */
export async function cartLines(attrsIn?: AttrFull[]): Promise<CartLine[]> {
  const rows = await readCart();
  if (!rows.length) return [];
  const attrs = attrsIn || (await getAttributes());
  const products = await db.product.findMany({ where: { id: { in: rows.map((r) => r.p) }, status: 'publish' }, include: FULL });
  const out: CartLine[] = [];
  for (const r of rows) {
    const product = products.find((x) => x.id === r.p);
    if (!product) continue;
    let price: number | null;
    let image = product.image;
    let variant = '';
    if (product.type === 'variable') {
      const v = product.variations.find((x) => x.id === r.v);
      if (!v || v.stock !== 'instock') continue;
      price = active(v.regularPrice, v.salePrice);
      image = v.image || image;
      variant = variantLabel(attrs, v);
    } else {
      if (product.stock !== 'instock') continue;
      price = active(product.regularPrice, product.salePrice);
    }
    if (price === null) continue;
    out.push({ key: `${r.p}:${r.v}`, product, variationId: product.type === 'variable' ? r.v : 0, variant, image, price, qty: r.q, total: price * r.q });
  }
  return out;
}
