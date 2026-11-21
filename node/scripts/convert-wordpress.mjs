// Chuyển dữ liệu từ bản WordPress (file iris.sql + thư mục wp-content/uploads) sang data/iris-export.json
// và chép ảnh gốc vào public/uploads/. Chỉ cần chạy 1 lần lúc chuyển từ WordPress sang (đã chạy sẵn).
//   node scripts/convert-wordpress.mjs <đường-dẫn-iris.sql> <thư-mục-wp-content/uploads>
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [sqlFile, uploadsDir] = process.argv.slice(2);
if (!sqlFile || !uploadsDir) {
  console.error('Cách dùng: node scripts/convert-wordpress.mjs iris.sql wp-content/uploads');
  process.exit(1);
}
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(sqlFile, 'utf8');

/* ---------------------------------------------------------------- Đọc lệnh INSERT của MySQL */
const tables = {};
const INT_COLS = new Set(['ID', 'post_id', 'meta_id', 'term_id', 'term_taxonomy_id', 'object_id', 'parent', 'post_parent', 'menu_order', 'count', 'post_author', 'term_order', 'umeta_id', 'user_id', 'option_id']);
const re = /INSERT INTO `(\w+)` \(([^)]*)\) VALUES\s*/g;
let m;
while ((m = re.exec(sql))) {
  const table = m[1].replace(/^wp_/, '');
  const cols = m[2].split(',').map((c) => c.trim().replace(/`/g, ''));
  let i = re.lastIndex;
  const rows = (tables[table] ||= []);
  for (;;) {
    while (/\s|,/.test(sql[i])) i++;
    if (sql[i] === ';') break;
    if (sql[i] !== '(') throw new Error('SQL lạ ở vị trí ' + i);
    i++;
    const vals = [];
    for (;;) {
      while (sql[i] === ' ') i++;
      if (sql[i] === "'") {
        let s = '';
        i++;
        for (;;) {
          const ch = sql[i];
          if (ch === '\\') {
            const n = sql[i + 1];
            s += { n: '\n', r: '\r', t: '\t', 0: '\0', Z: '\x1a' }[n] ?? n;
            i += 2;
          } else if (ch === "'" && sql[i + 1] === "'") {
            s += "'";
            i += 2;
          } else if (ch === "'") {
            i++;
            break;
          } else {
            s += ch;
            i++;
          }
        }
        vals.push(s);
      } else {
        let j = i;
        while (sql[j] !== ',' && sql[j] !== ')') j++;
        const raw = sql.slice(i, j).trim();
        vals.push(raw === 'NULL' ? null : Number(raw));
        i = j;
      }
      while (sql[i] === ' ') i++;
      if (sql[i] === ',') { i++; continue; }
      if (sql[i] === ')') { i++; break; }
    }
    // Cột mã số: luôn đổi sang số (file SQL có chỗ để trong dấu nháy).
    rows.push(Object.fromEntries(cols.map((c, k) => [c, INT_COLS.has(c) && vals[k] !== null ? Number(vals[k]) : vals[k]])));
  }
  re.lastIndex = i;
}

/* ---------------------------------------------------------------- unserialize() của PHP */
function unserialize(str) {
  if (typeof str !== 'string' || !/^[aOsibdN][:;]/.test(str)) return str;
  const buf = Buffer.from(str, 'utf8');
  let p = 0;
  const readUntil = (ch) => { const s = p; while (buf[p] !== ch.charCodeAt(0)) p++; const out = buf.toString('utf8', s, p); p++; return out; };
  function val() {
    const t = String.fromCharCode(buf[p]); p += 2;
    if (t === 'N') return null;
    if (t === 'b') return readUntil(';') === '1';
    if (t === 'i' || t === 'd') return Number(readUntil(';'));
    if (t === 's') { const len = +readUntil(':'); p++; const s = buf.toString('utf8', p, p + len); p += len + 2; return s; }
    if (t === 'a') {
      const n = +readUntil(':'); p++;
      const o = {};
      for (let k = 0; k < n; k++) { const key = val(); o[key] = val(); }
      p++;
      const keys = Object.keys(o);
      return keys.every((k, idx) => String(idx) === k) ? keys.map((k) => o[k]) : o;
    }
    throw new Error('unserialize: kiểu ' + t);
  }
  try { return val(); } catch { return str; }
}

/* ---------------------------------------------------------------- Dữ liệu WordPress */
const opt = Object.fromEntries((tables.options || []).map((r) => [r.option_name, r.option_value]));
const posts = tables.posts || [];
const meta = {};
for (const r of tables.postmeta || []) (meta[r.post_id] ||= {})[r.meta_key] = r.meta_value;
const terms = Object.fromEntries((tables.terms || []).map((t) => [t.term_id, t]));
const tax = Object.fromEntries((tables.term_taxonomy || []).map((t) => [t.term_taxonomy_id, { ...t, ...terms[t.term_id] }]));
const tmeta = {};
for (const r of tables.termmeta || []) (tmeta[r.term_id] ||= {})[r.meta_key] = r.meta_value;
const rel = {};
for (const r of tables.term_relationships || []) (rel[r.object_id] ||= []).push(tax[r.term_taxonomy_id]);
const byId = Object.fromEntries(posts.map((p) => [p.ID, p]));
const termsOf = (id, taxonomy) => (rel[id] || []).filter((t) => t && t.taxonomy === taxonomy);

// Ảnh: id → /uploads/năm/tháng/tên.webp (chép file gốc sang public/uploads).
const copied = new Set();
function img(id) {
  id = Number(id);
  if (!id) return '';
  const file = meta[id]?._wp_attached_file;
  if (!file) return '';
  const src = path.join(uploadsDir, file);
  const dst = path.join(ROOT, 'public/uploads', file);
  if (!copied.has(file) && existsSync(src)) {
    mkdirSync(path.dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    copied.add(file);
  }
  return '/uploads/' + file;
}
const imgs = (csv) => String(csv || '').split(',').map((x) => img(x.trim())).filter(Boolean);

// Bỏ chú thích khối Gutenberg, giữ HTML.
const clean = (html) => String(html || '').replace(/<!--\s*\/?wp:[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim();
const published = (p) => p.post_status === 'publish';

/* ---------------------------------------------------------------- Danh mục, thuộc tính */
const allTax = Object.values(tax);
const productCats = allTax.filter((t) => t.taxonomy === 'product_cat').map((t) => ({
  id: t.term_id, name: t.name, slug: t.slug, parent: t.parent, description: t.description || '',
  order: Number(tmeta[t.term_id]?.order || 0), image: img(tmeta[t.term_id]?.thumbnail_id),
  bannerTitle: tmeta[t.term_id]?.banner_title || '', bannerText: tmeta[t.term_id]?.banner_text || '', bannerImage: img(tmeta[t.term_id]?.banner_image),
}));
const attrTax = (tables.woocommerce_attribute_taxonomies || []).map((a) => ({ taxonomy: 'pa_' + a.attribute_name, label: a.attribute_label }));
const attributes = attrTax.map((a) => ({ ...a, terms: allTax.filter((t) => t.taxonomy === a.taxonomy).map((t) => ({ slug: t.slug, name: t.name })) }));
const postCats = allTax.filter((t) => t.taxonomy === 'category').map((t) => ({ id: t.term_id, name: t.name, slug: t.slug, description: t.description || '' }));

/* ---------------------------------------------------------------- Sản phẩm */
const num = (v) => (v === undefined || v === null || v === '' ? null : Math.round(Number(v)));
const products = posts.filter((p) => p.post_type === 'product' && p.post_status !== 'auto-draft' && p.post_status !== 'trash').map((p) => {
  const mt = meta[p.ID] || {};
  const pattrs = unserialize(mt._product_attributes) || {};
  const attrs = {};
  for (const [key, a] of Object.entries(pattrs)) {
    if (a.is_taxonomy) attrs[key] = termsOf(p.ID, key).map((t) => t.slug);
    else attrs[key] = String(a.value || '').split('|').map((s) => s.trim()).filter(Boolean);
  }
  const type = termsOf(p.ID, 'product_type')[0]?.slug || 'simple';
  const variations = posts.filter((v) => v.post_type === 'product_variation' && v.post_parent === p.ID && v.post_status === 'publish').sort((a, b) => a.menu_order - b.menu_order).map((v) => {
    const vm = meta[v.ID] || {};
    return {
      attrs: Object.fromEntries(Object.entries(vm).filter(([k]) => k.startsWith('attribute_')).map(([k, val]) => [k.slice(10), val])),
      regular: num(vm._regular_price), sale: num(vm._sale_price), image: img(vm._thumbnail_id), sku: vm._sku || '',
      stock: vm._stock_status || 'instock', description: vm._variation_description || '',
    };
  });
  return {
    wpId: p.ID, slug: decodeURIComponent(p.post_name), name: p.post_title, status: published(p) ? 'publish' : 'draft', type,
    content: clean(p.post_content), short: clean(p.post_excerpt), regular: num(mt._regular_price), sale: num(mt._sale_price),
    sku: mt._sku || '', stock: mt._stock_status || 'instock', image: img(mt._thumbnail_id), gallery: imgs(mt._product_image_gallery),
    cats: termsOf(p.ID, 'product_cat').map((t) => t.slug), attrs, variations, date: p.post_date, menuOrder: p.menu_order,
    featured: termsOf(p.ID, 'product_visibility').some((t) => t.slug === 'featured'),
  };
});

/* ---------------------------------------------------------------- Bài viết, trang, phản hồi */
const blogPosts = posts.filter((p) => p.post_type === 'post' && published(p)).map((p) => ({
  slug: decodeURIComponent(p.post_name), title: p.post_title, content: clean(p.post_content), excerpt: p.post_excerpt || '',
  image: img(meta[p.ID]?._thumbnail_id), date: p.post_date, cats: termsOf(p.ID, 'category').map((t) => t.slug),
}));
const special = { [opt.page_on_front]: 'home', [opt.page_for_posts]: 'blog', [opt.woocommerce_shop_page_id]: 'shop', [opt.woocommerce_cart_page_id]: 'cart', [opt.woocommerce_checkout_page_id]: 'checkout', [opt.woocommerce_myaccount_page_id]: 'account' };
const pages = posts.filter((p) => p.post_type === 'page' && published(p)).map((p) => {
  const tpl = meta[p.ID]?._wp_page_template || '';
  return {
    wpId: p.ID, slug: decodeURIComponent(p.post_name), title: p.post_title, content: clean(p.post_content), parent: p.post_parent,
    template: special[p.ID] || (tpl.includes('about') ? 'about' : tpl.includes('contact') ? 'contact' : ''), order: p.menu_order,
  };
});
const testimonials = posts.filter((p) => p.post_type === 'iris_testimonial' && published(p)).sort((a, b) => a.menu_order - b.menu_order).map((p) => ({
  name: p.post_title, role: meta[p.ID]?.role || '', content: clean(p.post_content), image: img(meta[p.ID]?._thumbnail_id), order: p.menu_order,
}));

/* ---------------------------------------------------------------- Menu */
const mods = unserialize(opt.theme_mods_iris) || {};
const pageUrl = (id) => {
  const p = byId[id];
  if (!p) return '/';
  const t = special[id];
  if (t === 'home') return '/';
  if (t === 'shop') return '/cua-hang/';
  if (t === 'cart') return '/gio-hang/';
  if (t === 'checkout') return '/thanh-toan/';
  if (t === 'account') return '/tai-khoan/';
  if (t === 'blog') return '/blog/';
  return '/' + decodeURIComponent(p.post_name) + '/';
};
function itemUrl(mt) {
  const type = mt._menu_item_type;
  const obj = mt._menu_item_object;
  const oid = Number(mt._menu_item_object_id);
  if (type === 'custom') {
    const u = String(mt._menu_item_url || '').replace(/^https?:\/\/iris\.local/, '') || '/';
    const pid = u.match(/[?&]page_id=(\d+)/);
    return pid ? pageUrl(Number(pid[1])) : u;
  }
  if (type === 'post_type') {
    if (obj === 'page') return pageUrl(oid);
    if (obj === 'product') return '/san-pham/' + decodeURIComponent(byId[oid]?.post_name || '') + '/';
    return '/' + decodeURIComponent(byId[oid]?.post_name || '') + '/';
  }
  if (type === 'taxonomy') {
    const t = allTax.find((x) => x.term_id === oid && x.taxonomy === obj);
    if (!t) return '/';
    if (obj === 'product_cat') return '/danh-muc-san-pham/' + t.slug + '/';
    if (obj === 'category') return '/category/' + t.slug + '/';
  }
  return '/';
}
const menus = {};
for (const [loc, termId] of Object.entries(mods.nav_menu_locations || {})) {
  const items = posts.filter((p) => p.post_type === 'nav_menu_item' && (rel[p.ID] || []).some((t) => t?.term_id === termId)).sort((a, b) => a.menu_order - b.menu_order);
  const build = (parent) => items.filter((p) => Number(meta[p.ID]?._menu_item_menu_item_parent || 0) === parent).map((p) => {
    const mt = meta[p.ID] || {};
    const oid = Number(mt._menu_item_object_id);
    const obj = mt._menu_item_object;
    const title = p.post_title || (obj === 'product_cat' || obj === 'category' ? allTax.find((x) => x.term_id === oid)?.name : byId[oid]?.post_title) || '';
    return { title, url: itemUrl(mt), target: mt._menu_item_target || '', object: obj, catSlug: obj === 'product_cat' ? allTax.find((x) => x.term_id === oid)?.slug || '' : '', children: build(p.ID) };
  });
  menus[loc] = build(0);
}

/* ---------------------------------------------------------------- Nội dung tùy biến (Customizer) */
const IMAGE_KEYS = ['custom_logo', 'logo_light', 'hero_image', 'about_image', 'video_image', 'ab_banner', 'ab_image_1', 'ab_image_2', 'ct_banner'];
const GALLERY_KEYS = ['brands', 'press', 'instagram', 'ct_follow'];
const CAT_KEYS = ['cats_exclude', 'room_1', 'room_2', 'room_3', 'ps1_cat', 'ps2_cat', 'ps3_cat', 'ab_service_1', 'ab_service_2', 'ab_service_3'];
const site = {};
for (const [k, v] of Object.entries(mods)) {
  if (k === 'nav_menu_locations' || k === 'custom_css_post_id' || k.startsWith('sidebars')) continue;
  if (IMAGE_KEYS.includes(k)) site[k] = img(v);
  else if (GALLERY_KEYS.includes(k)) site[k] = imgs(v);
  else if (CAT_KEYS.includes(k)) site[k] = Number(v) ? allTax.find((t) => t.term_id === Number(v) && t.taxonomy === 'product_cat')?.slug || '' : '';
  else site[k] = typeof v === 'boolean' ? (v ? '1' : '0') : v;
}
site.site_name = opt.blogname || '';
site.site_tagline = opt.blogdescription || '';
site.favicon = img(opt.site_icon);

const payments = {
  cod: unserialize(opt.woocommerce_cod_settings) || {},
  bacs: unserialize(opt.woocommerce_bacs_settings) || {},
  bacsAccounts: unserialize(opt.woocommerce_bacs_accounts) || [],
};

const out = { exportedAt: new Date().toISOString(), site, menus, productCats, attributes, products, postCats, posts: blogPosts, pages, testimonials, payments };
writeFileSync(path.join(ROOT, 'data/iris-export.json'), JSON.stringify(out, null, 1));
console.log(`Xong: ${products.length} sản phẩm, ${productCats.length} danh mục, ${blogPosts.length} bài viết, ${pages.length} trang, ${testimonials.length} phản hồi, ${copied.size} ảnh.`);
