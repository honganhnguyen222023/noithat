// Nạp dữ liệu từ data/iris-export.json (chuyển từ bản WordPress) vào cơ sở dữ liệu.
// Chạy: npm run import:data   (chạy lại được: dữ liệu cũ của sản phẩm, bài viết, trang… sẽ được thay mới,
// riêng tài khoản, đơn hàng, tin nhắn liên hệ được giữ nguyên).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(path.join(ROOT, 'data/iris-export.json'), 'utf8'));
const db = new PrismaClient();
const date = (s) => (s ? new Date(s.replace(' ', 'T') + '+07:00') : new Date());
const has = (tag) => /<(p|div|h[1-6]|ul|ol|table|blockquote|figure)\b/i.test(tag);
const autop = (s) => (!s ? '' : has(s) ? s : s.split(/\n\s*\n/).map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`).join(''));

async function main() {
  // Xóa nội dung cũ (giữ tài khoản, đơn hàng, tin nhắn).
  await db.productCategory.deleteMany();
  await db.variation.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();
  await db.attrTerm.deleteMany();
  await db.attribute.deleteMany();
  await db.postCategory.deleteMany();
  await db.post.deleteMany();
  await db.blogCategory.deleteMany();
  await db.page.deleteMany();
  await db.testimonial.deleteMany();

  // Danh mục sản phẩm (2 lượt: tạo trước, gắn cha sau).
  const catId = {};
  for (const c of data.productCats) {
    const row = await db.category.create({ data: { name: c.name, slug: c.slug, description: c.description, sortOrder: c.order, image: c.image, bannerTitle: c.bannerTitle, bannerText: c.bannerText, bannerImage: c.bannerImage } });
    catId[c.id] = row.id;
    catId[c.slug] = row.id;
  }
  for (const c of data.productCats) if (c.parent && catId[c.parent]) await db.category.update({ where: { id: catId[c.id] }, data: { parentId: catId[c.parent] } });

  // Thuộc tính.
  for (const a of data.attributes) {
    await db.attribute.create({ data: { key: a.taxonomy, label: a.label, terms: { create: a.terms.map((t, i) => ({ slug: t.slug, name: t.name, sortOrder: i })) } } });
  }

  // Sản phẩm.
  for (const [i, p] of data.products.entries()) {
    if (await db.product.findUnique({ where: { slug: p.slug } })) p.slug += '-' + (i + 1);
    await db.product.create({
      data: {
        slug: p.slug, name: p.name, status: p.status, type: p.type === 'variable' ? 'variable' : 'simple', content: p.content, short: p.short,
        regularPrice: p.regular, salePrice: p.sale, sku: p.sku, stock: p.stock, image: p.image, gallery: JSON.stringify(p.gallery),
        attrs: JSON.stringify(p.attrs), featured: p.featured, sortOrder: Number(p.menuOrder) || 0, createdAt: date(p.date),
        categories: { create: p.cats.filter((s) => catId[s]).map((s) => ({ categoryId: catId[s] })) },
        variations: { create: p.variations.map((v, k) => ({ attrs: JSON.stringify(v.attrs), regularPrice: v.regular, salePrice: v.sale, image: v.image, sku: v.sku, stock: v.stock, sortOrder: k })) },
      },
    });
  }

  // Blog.
  const blogCat = {};
  for (const c of data.postCats) blogCat[c.slug] = (await db.blogCategory.create({ data: { name: c.name, slug: c.slug, description: c.description } })).id;
  for (const p of data.posts) {
    await db.post.create({ data: { slug: p.slug, title: p.title, content: autop(p.content), excerpt: p.excerpt, image: p.image, createdAt: date(p.date), categories: { create: p.cats.filter((s) => blogCat[s]).map((s) => ({ categoryId: blogCat[s] })) } } });
  }

  // Trang (bỏ các trang của WooCommerce: cửa hàng, giỏ hàng, thanh toán, tài khoản – đã có trang riêng).
  for (const p of data.pages) {
    if (['shop', 'cart', 'checkout', 'account', 'home', 'blog'].includes(p.template)) continue;
    await db.page.create({ data: { slug: p.slug, title: p.title, content: autop(p.content), template: p.template } });
  }

  for (const t of data.testimonials) await db.testimonial.create({ data: { name: t.name, role: t.role, content: autop(t.content), image: t.image, sortOrder: t.order } });

  // Cài đặt: nội dung website, menu, thanh toán.
  const set = (key, value) => db.setting.upsert({ where: { key }, create: { key, value: JSON.stringify(value) }, update: { value: JSON.stringify(value) } });
  await set('site', data.site);
  await set('menus', data.menus);
  const pay = data.payments;
  await set('payments', {
    cod: { enabled: pay.cod.enabled !== 'no', title: pay.cod.title || 'Thanh toán khi nhận hàng (COD)', instructions: pay.cod.instructions || 'Trả tiền mặt khi nhận hàng.' },
    bacs: { enabled: pay.bacs.enabled !== 'no', title: pay.bacs.title || 'Chuyển khoản ngân hàng', instructions: pay.bacs.instructions || 'Chuyển khoản theo thông tin bên dưới, ghi nội dung là mã đơn hàng. Đơn hàng được giao sau khi chúng tôi nhận được tiền.', accounts: (pay.bacsAccounts || []).map((a) => ({ bank: a.bank_name || '', number: a.account_number || '', name: a.account_name || '' })) },
  });

  // Tài khoản quản trị + khách hàng thử (chỉ tạo khi chưa có).
  if (!(await db.user.findUnique({ where: { login: 'admin' } }))) {
    await db.user.create({ data: { login: 'admin', email: 'admin@noithat.local', name: 'Quản trị', role: 'admin', passwordHash: await bcrypt.hash('admin', 10) } });
  }
  if (!(await db.user.findUnique({ where: { login: 'khachhang' } }))) {
    await db.user.create({ data: { login: 'khachhang', email: 'khachhang@noithat.local', name: 'Khách Hàng Thử', phone: '0912345678', address: 'Số 1 Cầu Giấy, Hà Nội', role: 'customer', passwordHash: await bcrypt.hash('khachhang123', 10) } });
  }

  const n = await Promise.all([db.product.count(), db.category.count(), db.post.count(), db.page.count()]);
  console.log(`Đã nạp: ${n[0]} sản phẩm, ${n[1]} danh mục, ${n[2]} bài viết, ${n[3]} trang.`);
  console.log('Quản trị: admin / admin   ·   Khách hàng thử: khachhang / khachhang123');
}

main().finally(() => db.$disconnect());
