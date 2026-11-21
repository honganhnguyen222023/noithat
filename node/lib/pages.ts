// Blog (danh sách, chuyên mục, bài viết), trang thường, trang Giới thiệu, trang Liên hệ, 404
// (viết lại từ index.php, single.php, page.php, page-templates/about.php, contact.php, 404.php, inc/contact-form.php).
import type { BlogCategory, Page, Post } from '@prisma/client';
import { blogSidebar, postCard, postUrl, toc } from './blog';
import { pagination } from './catalog';
import { db } from './db';
import { esc, vnDate } from './html';
import { ic } from './icons';
import { breadcrumbs, sectionTitle } from './layout';
import { mapSrc, mod, mods, type Settings, socials, tel } from './settings';
import { catUrl, getCategories } from './shop';

const PER_PAGE = 10;

/** Danh sách bài viết: /blog/, /category/<slug>/, tìm kiếm bài viết. */
export async function blogListHtml(cat: BlogCategory | null, page: number): Promise<string> {
  const where = { status: 'publish', ...(cat ? { categories: { some: { categoryId: cat.id } } } : {}) };
  const [total, posts] = await Promise.all([db.post.count({ where }), db.post.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER_PAGE, take: PER_PAGE })]);
  const heading = cat ? cat.name : 'Blog kiến thức';
  const base = cat ? `/category/${cat.slug}/` : '/blog/';
  let main = `<h1 class="mb-6 text-2xl font-bold uppercase text-gold lg:text-[28px]">${esc(heading)}</h1>`;
  if (cat?.description) main += `<div class="entry-content mb-8">${cat.description}</div>`;
  main += posts.length
    ? `<div class="grid gap-x-[30px] gap-y-10 sm:grid-cols-2">${posts.map((p) => postCard(p)).join('')}</div><div class="iris-pagination mt-12">${pagination(page, Math.ceil(total / PER_PAGE), (n) => base + (n > 1 ? `?trang=${n}` : ''))}</div>`
    : '<div class="rounded-xl bg-white p-8"><p>Chưa có bài viết nào.</p></div>';
  return `<div class="container-x py-6 lg:py-8">${breadcrumbs(cat ? [['Blog kiến thức', '/blog/'], [cat.name]] : [['Blog kiến thức']], 'mb-6 text-[17px]')}<div class="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-[30px]"><div class="order-2 lg:order-1">${await blogSidebar()}</div><div class="order-1 min-w-0 lg:order-2">${main}</div></div></div>`;
}

export async function postHtml(p: Post & { categories: { category: BlogCategory }[] }): Promise<string> {
  const { html, items } = toc(p.content);
  // Mục lục đặt sau đoạn mở đầu (như bản WordPress).
  const cut = html.indexOf('</p>');
  const firstH2 = html.indexOf('<h2');
  const intro = cut >= 0 && (firstH2 < 0 || cut < firstH2) ? html.slice(0, cut + 4) : '';
  const body = html.slice(intro.length);
  const cats = p.categories.map((c) => c.category);
  let tocHtml = '';
  if (items.length > 2) {
    const n = [0, 0];
    tocHtml = `<nav class="toc" aria-label="Mục lục" data-toc><div class="flex items-center justify-between"><p class="text-xl font-bold text-ink">Nội dung</p><button type="button" class="toc__toggle" data-toc-toggle aria-expanded="true" aria-label="Ẩn/hiện mục lục">${ic('list-tree', 'size-5')}</button></div><ol class="toc__list" data-toc-list>${items
      .map((it) => {
        let num: string;
        if (it.level === 2) { n[0]++; n[1] = 0; num = n[0] + '.'; } else { n[1]++; num = `${n[0]}.${n[1]}.`; }
        return `<li class="${it.level === 3 ? 'pl-6 text-[14px]' : ''}"><a href="#${it.id}"><span class="mr-1">${num}</span>${esc(it.text.replace(/^[\d.]+\s*/, ''))}</a></li>`;
      })
      .join('')}</ol></nav>`;
  }
  const related = cats.length ? await db.post.findMany({ where: { status: 'publish', id: { not: p.id }, categories: { some: { categoryId: { in: cats.map((c) => c.id) } } } }, orderBy: { createdAt: 'desc' }, take: 2 }) : [];
  const url = (process.env.SITE_URL || 'http://localhost:3000') + postUrl(p);
  const trail: [string, string?][] = cats[0] ? [[cats[0].name, `/category/${cats[0].slug}/`], [p.title]] : [['Blog kiến thức', '/blog/'], [p.title]];
  const article = `<article class="order-1 min-w-0 lg:order-2"><header class="mb-6"><p class="mb-1 text-xs font-bold uppercase tracking-wide text-[#3b6c86]">${cats.map((c) => `<a href="/category/${c.slug}/">${esc(c.name)}</a>`).join(', ')}</p><h1 class="text-[26px] leading-tight font-bold text-gold lg:text-[30px]">${esc(p.title)}</h1><p class="mt-3 flex items-center gap-2 text-sm text-neutral-600">${ic('calendar', 'size-4')}<time datetime="${p.createdAt.toISOString()}">${vnDate(p.createdAt)}</time></p></header>
${intro ? `<div class="entry-content mb-6">${intro}</div>` : ''}${tocHtml}<div class="entry-content">${body}</div>
<footer class="mt-10 flex flex-wrap items-center gap-3 border-t border-neutral-300 pt-6"><span class="font-bold">Chia sẻ:</span><a class="social-btn bg-[#1877f2]" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="Chia sẻ Facebook">${ic('facebook', 'size-4')}</a><a class="social-btn bg-[#0068ff]" href="https://zalo.me/share?url=${encodeURIComponent(url)}" target="_blank" rel="noopener" aria-label="Chia sẻ Zalo">${ic('zalo', 'size-5')}</a></footer>
${related.length ? `<section class="mt-12"><h2 class="mb-6 text-2xl font-bold text-gold">Bài viết liên quan</h2><div class="grid gap-8 sm:grid-cols-2">${related.map((r) => postCard(r)).join('')}</div></section>` : ''}</article>`;
  return `<div class="container-x py-6 lg:py-8">${breadcrumbs(trail, 'mb-6 text-[17px]')}<div class="grid gap-8 lg:grid-cols-[300px_1fr] lg:gap-[30px]"><div class="order-2 lg:order-1">${await blogSidebar()}</div>${article}</div></div>`;
}

export function pageHtml(p: Page): string {
  return `<div class="container-x py-6 lg:py-8">${breadcrumbs([[p.title]], 'mb-6 text-[17px]')}<article class="mx-auto max-w-[900px] rounded-2xl bg-white p-6 lg:p-12"><h1 class="mb-6 text-[28px] leading-tight font-bold text-gold lg:text-[34px]">${esc(p.title)}</h1><div class="entry-content">${p.content}</div></article></div>`;
}

/* ---------------------------------------------------------------- Form liên hệ */

export function contactForm(source: string, back: string, status: string): string {
  const msg = status === 'ok' ? '<p class="rounded-lg bg-emerald-50 p-4 text-emerald-800" role="status">Cảm ơn bạn! Chúng tôi đã nhận được lời nhắn và sẽ liên hệ lại sớm nhất.</p>' : status === 'loi' ? '<p class="rounded-lg bg-red-50 p-4 text-red-700" role="alert">Vui lòng nhập họ tên và số điện thoại hoặc email hợp lệ.</p>' : '';
  return `<form class="contact-form grid gap-4" method="post" action="/api/form/lien-he/">${msg}<input type="hidden" name="source" value="${esc(source)}"><input type="hidden" name="back" value="${esc(back)}">
<div class="hidden" aria-hidden="true"><label>Website <input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
<div class="grid gap-4 sm:grid-cols-2"><label class="field"><span>Họ và tên *</span><input type="text" name="name" required autocomplete="name"></label><label class="field"><span>Số điện thoại *</span><input type="tel" name="phone" required autocomplete="tel" inputmode="tel"></label></div>
<label class="field"><span>Email</span><input type="email" name="email" autocomplete="email"></label><label class="field"><span>Nội dung</span><textarea name="message" rows="5" placeholder="Bạn cần tư vấn sản phẩm nào?"></textarea></label>
<button type="submit" class="btn-gold justify-self-start">${ic('send', 'size-4')} Gửi lời nhắn</button></form>`;
}

/* ---------------------------------------------------------------- Trang Giới thiệu */

export async function aboutHtml(p: Page, s: Settings): Promise<string> {
  const all = await getCategories();
  const services = ['ab_service_1', 'ab_service_2', 'ab_service_3'].map((k) => all.find((c) => c.slug === mod(s, k))).filter((c): c is NonNullable<typeof c> => !!c);
  const img = (src: string, cls: string, extra = 'loading="lazy"') => (src ? `<img src="${esc(src)}" class="${cls}" alt="" decoding="async" ${extra}>` : '');
  let out = `<h1 class="sr-only">${esc(p.title)}</h1><section class="relative flex h-[300px] items-center overflow-hidden bg-neutral-700 lg:h-[478px]">${img(mod(s, 'ab_banner'), 'absolute inset-0 size-full object-cover', 'loading="eager" fetchpriority="high"')}<div class="absolute inset-0 bg-black/15"></div><p class="container-x relative text-[44px] font-bold text-white drop-shadow-lg lg:text-[70px]" data-reveal="left">${esc(mod(s, 'ab_title'))}</p></section>`;
  out += `<nav class="container-x grid grid-cols-3 py-[30px]" aria-label="Mục lục trang">${[['gioi-thieu-iris', 'Giới thiệu'], ['trai-nghiem', 'Trải nghiệm'], ['dich-vu', 'Dịch vụ']].map(([id, l]) => `<a href="#${id}" class="border-neutral-300 py-5 text-center font-bold text-[#344943] transition hover:text-gold [&:not(:last-child)]:border-r">${l}</a>`).join('')}</nav>`;
  out += `<section id="gioi-thieu-iris" class="container-x scroll-mt-28 py-10"><span class="block h-0.5 w-[50px] bg-[#4d8ad2]"></span><h2 class="mt-4 text-[30px] leading-tight font-bold text-gold lg:text-[40px]" data-reveal>${esc(mod(s, 'ab_heading'))}</h2><div class="mt-8 grid gap-8 text-[17px] leading-[1.6] lg:grid-cols-3 lg:gap-10"><div class="hidden lg:block"></div><p data-reveal>${esc(mod(s, 'ab_text_1'))}</p><p data-reveal style="--d:120ms">${esc(mod(s, 'ab_text_2'))}</p></div></section>`;
  out += `<section id="trai-nghiem" class="scroll-mt-28 bg-[linear-gradient(to_bottom,transparent_0,transparent_360px,#253446_360px)] pt-[60px] pb-20 text-white"><div class="container-x"><div class="grid items-start gap-[30px] md:grid-cols-2"><div class="overflow-hidden rounded-2xl" data-reveal="zoom">${img(mod(s, 'ab_image_1'), 'aspect-[630/360] w-full object-cover')}</div><div class="overflow-hidden rounded-2xl" data-reveal="zoom" style="--d:120ms">${img(mod(s, 'ab_image_2'), 'aspect-[630/500] w-full object-cover')}</div></div><div class="mt-20 space-y-[90px] lg:mt-[170px]">${[1, 2, 3]
    .map((n) => `<div data-reveal><p class="text-[15px] font-bold text-[#3fc0a0]">0${n}</p><div class="mt-2 grid gap-6 border-t border-white/25 pt-8 lg:grid-cols-2 lg:gap-[45px]"><h3 class="text-[28px] font-bold lg:text-[38px]">${esc(mod(s, `ab_v${n}_title`))}</h3><p class="leading-[1.6]">${esc(mod(s, `ab_v${n}_text`))}</p></div></div>`)
    .join('')}</div></div></section>`;
  if (services.length) {
    out += `<section id="dich-vu" class="scroll-mt-28 bg-[linear-gradient(90deg,#f1f4f7_50%,transparent_50%)] pt-[120px] pb-24 lg:pt-[166px]"><div class="container-x"><span class="block h-0.5 w-[50px] bg-[#4d8ad2]"></span><h2 class="mt-16 text-[26px] font-bold text-gold lg:text-[30px]" data-reveal>${esc(mod(s, 'ab_services_title'))}</h2><div class="mt-10 grid gap-[30px] md:grid-cols-3">${services
      .map((c, i) => `<a href="${catUrl(c)}" class="room-card aspect-square group" data-reveal style="--d:${i * 100}ms">${img(c.image, 'room-card__img')}<span class="room-card__shine" aria-hidden="true"></span><span class="absolute inset-x-0 bottom-[40px] z-10 flex flex-col items-center gap-6 text-center"><span class="h-[50px] w-px bg-white"></span><span class="text-lg font-bold text-white drop-shadow lg:text-xl">Nội thất ${esc(c.name.toLowerCase())}</span></span></a>`)
      .join('')}</div></div></section>`;
  }
  if (p.content.trim()) out += `<section class="container-x pb-16"><div class="entry-content">${p.content}</div></section>`;
  return out;
}

/* ---------------------------------------------------------------- Trang Liên hệ */

export function contactPageHtml(p: Page, s: Settings, status: string): string {
  const follow = mods(s, 'ct_follow');
  const cards: [string, string, string, string][] = [
    ['mail', 'Gửi email cho chúng tôi', mod(s, 'email'), 'mailto:' + mod(s, 'email')],
    ['map-pin', 'Ghé thăm showroom', mod(s, 'address'), 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(mod(s, 'address'))],
    ['phone-call', 'Gọi cho chúng tôi', mod(s, 'phone'), tel(mod(s, 'phone'))],
  ];
  let out = `<section class="px-[10px] pt-[10px] lg:px-[25px]"><div class="relative h-[350px] overflow-hidden rounded-2xl lg:h-[500px]">${mod(s, 'ct_banner') ? `<img src="${esc(mod(s, 'ct_banner'))}" class="size-full object-cover object-[53%_48%]" alt="" loading="eager" fetchpriority="high">` : ''}</div></section><span class="mx-auto block h-[95px] w-0.5 -translate-y-[1px] bg-[#1d2b45]" aria-hidden="true"></span>`;
  out += `<section class="container-x pt-16 text-center"><h1 class="text-[40px] font-bold text-gold lg:text-[50px]" data-reveal>${esc(mod(s, 'ct_title') || p.title)}</h1><p class="mx-auto mt-6 max-w-[640px] leading-[1.6]" data-reveal>${esc(mod(s, 'ct_text'))}</p><div class="mx-auto mt-14 grid max-w-[1000px] gap-10 sm:grid-cols-3">${cards
    .map(([icn, label, value, href], i) => `<a href="${esc(href)}" class="group flex flex-col items-center" data-reveal style="--d:${i * 100}ms"${i === 1 ? ' target="_blank" rel="noopener"' : ''}><span class="flex size-[50px] items-center justify-center rounded-xl bg-gradient-to-br from-[#fdcc7f] to-[#e8762b] text-white shadow-md transition group-hover:-translate-y-1">${ic(icn, 'size-6')}</span><span class="mt-4 text-xl font-bold text-gold">${esc(label)}</span><span class="mt-1">${esc(value)}</span></a>`)
    .join('')}</div></section>`;
  out += `<section id="lien-he-form" class="container-x scroll-mt-28 py-16"><div class="grid overflow-hidden rounded-2xl bg-white shadow-sm lg:grid-cols-2"><div class="p-6 lg:p-12"><h2 class="mb-6 text-[28px] font-bold text-gold">${esc(mod(s, 'ct_form_title'))}</h2>${contactForm('Trang liên hệ', `/${p.slug}/`, status)}</div><div class="min-h-[320px]" data-lazy-map="${esc(mapSrc(s))}"><button type="button" class="flex size-full flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-600 hover:text-gold">${ic('map-pin', 'size-8 text-gold')} Xem bản đồ</button></div></div></section>`;
  if (follow.length) out += `<span class="mx-auto block h-[150px] w-0.5 bg-[#1d2b45]" aria-hidden="true"></span><section class="container-x pb-14">${sectionTitle(mod(s, 'ct_follow_title'), 'h2', 'mb-12 !text-[40px] lg:!text-[46px]')}<div class="grid gap-5 sm:grid-cols-3">${follow.map((src, i) => `<div class="room-card aspect-square" data-reveal style="--d:${i * 100}ms"><img src="${esc(src)}" class="room-card__img" alt="" loading="lazy"><span class="room-card__shine" aria-hidden="true"></span></div>`).join('')}</div></section>`;
  const so = socials(s);
  const colors: Record<string, string> = { facebook: '#3b5998', instagram: '#c13584', youtube: '#ff0000', tiktok: '#111' };
  if (so.length) out += `<section class="container-x pt-10 pb-20 text-center">${sectionTitle(mod(s, 'ct_social_title'), 'h2', 'mb-6')}<ul class="flex justify-center gap-2">${so.map(([k, l, u]) => `<li><a href="${esc(u)}" class="social-btn size-10" style="background:${colors[k]}" target="_blank" rel="noopener" aria-label="${esc(l)}">${ic(k, 'size-5')}</a></li>`).join('')}</ul></section>`;
  return out;
}

export function notFoundHtml(): string {
  return `<div class="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center"><p class="text-[120px] leading-none font-bold text-gold/30">404</p><h1 class="mt-2 text-3xl font-bold text-gold">Không tìm thấy trang</h1><p class="mt-4 max-w-md">Trang bạn tìm có thể đã được đổi tên hoặc không còn tồn tại. Hãy thử tìm sản phẩm bên dưới.</p>
<form role="search" method="get" action="/cua-hang/" class="mt-8 flex w-full max-w-md items-center rounded-full border border-neutral-300 bg-white px-5"><label class="sr-only" for="s404">Tìm kiếm</label><input id="s404" type="search" name="s" placeholder="Tìm sản phẩm..." class="h-12 flex-1 bg-transparent outline-none"><button type="submit" aria-label="Tìm">${ic('search', 'size-5')}</button></form><a href="/" class="btn-gold mt-6">${ic('house', 'size-4')} Về trang chủ</a></div>`;
}
