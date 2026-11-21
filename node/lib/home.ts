// Trang chủ: 11 khối (viết lại từ template-parts/home/*.php của theme IRIS).
import { db } from './db';
import { esc, youtubeId } from './html';
import { ic } from './icons';
import { sectionTitle } from './layout';
import { mod, mods, on, type Settings } from './settings';
import { catUrl, getAttributes, getCategories, latestProducts, productCard } from './shop';
import { postCard, testimonials } from './blog';

const img = (src: string, cls: string, extra = '') => (src ? `<img src="${esc(src)}" class="${cls}" alt="" decoding="async" ${extra}>` : '');

function hero(s: Settings): string {
  return `<section class="hero relative isolate flex h-[min(800px,100svh)] min-h-[560px] items-center justify-center overflow-hidden bg-neutral-700">
${img(mod(s, 'hero_image'), 'hero__img absolute inset-0 -z-10 size-full object-cover object-[58%_50%]', 'loading="eager" fetchpriority="high"')}
<div class="absolute inset-0 -z-10 bg-gradient-to-b from-black/35 via-black/5 to-black/20"></div>
<h1 class="hero__title container-x text-center">${esc(mod(s, 'hero_title'))}</h1>
<a href="#home-about" class="hero__scroll" aria-label="Cuộn xuống">${ic('chevron-down', 'size-6')}</a></section>`;
}

function about(s: Settings): string {
  if (!on(s, 'about_show')) return '';
  const paras = mod(s, 'about_text').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  return `<section id="home-about" class="container-x py-[30px]"><div class="grid lg:grid-cols-1">
<div class="about-panel relative z-10 lg:col-start-1 lg:row-start-1 lg:w-1/2 lg:self-end" data-reveal="left"><h2 class="mb-5 text-[32px] leading-tight font-bold text-[#62616b] lg:text-[40px]">${esc(mod(s, 'about_title'))}</h2>
<div class="space-y-4 text-[15px] leading-[1.6] text-ink sm:text-base">${paras.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
${mod(s, 'about_button') ? `<a href="${esc(mod(s, 'about_link'))}" class="btn-gold mt-9">${esc(mod(s, 'about_button'))} ${ic('chevron-right', 'size-4')}</a>` : ''}</div>
<div class="overflow-hidden lg:col-start-1 lg:row-start-1 lg:w-4/5 lg:justify-self-end" data-reveal="zoom">${img(mod(s, 'about_image'), 'block h-auto w-full', 'loading="lazy"')}</div></div></section>`;
}

async function categories(s: Settings): Promise<string> {
  if (!on(s, 'cats_show')) return '';
  const skip = ['cats_exclude', 'room_1', 'room_2', 'room_3', 'ab_service_3'].map((k) => mod(s, k)).filter(Boolean);
  const cats = (await getCategories()).filter((c) => !c.parentId && c.image && !skip.includes(c.slug));
  if (!cats.length) return '';
  return `<section class="container-x pb-12 lg:pb-14"><div class="carousel relative" data-carousel>${sectionTitle(mod(s, 'cats_title'), 'h2', 'mb-4 px-12')}
<button type="button" class="carousel__arrow carousel__arrow--plain left-0 top-1 lg:left-5" data-prev aria-label="Danh mục trước">${ic('arrow-left', 'size-8 stroke-[1.5]')}</button>
<button type="button" class="carousel__arrow carousel__arrow--plain right-0 top-1 lg:right-5" data-next aria-label="Danh mục sau">${ic('arrow-right', 'size-8 stroke-[1.5]')}</button>
<div class="carousel__track gap-4 lg:gap-6" data-track>${cats.map((c) => `<a href="${catUrl(c)}" class="cat-circle w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] lg:w-[calc(25%-18px)]"><span class="cat-circle__img"><img src="${esc(c.image)}" alt="" loading="lazy" decoding="async"></span><span class="cat-circle__label">${esc(c.name)}</span></a>`).join('')}</div></div></section>`;
}

async function rooms(s: Settings): Promise<string> {
  if (!on(s, 'rooms_show')) return '';
  const all = await getCategories();
  const list = ['room_1', 'room_2', 'room_3'].map((k) => all.find((c) => c.slug === mod(s, k))).filter((c): c is NonNullable<typeof c> => !!c);
  if (!list.length) return '';
  return `<section class="mx-auto max-w-[1440px] px-[15px] pb-14">${sectionTitle(mod(s, 'rooms_title'), 'h2', 'mb-8')}<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-[30px]">${list
    .map((r, i) => `<a href="${catUrl(r)}" class="room-card group" data-reveal style="--d:${i * 90}ms">${img(r.image, 'room-card__img', 'loading="lazy"')}<span class="room-card__shine" aria-hidden="true"></span><span class="absolute bottom-12 left-6 z-10 lg:left-[22px]"><span class="block text-2xl font-bold uppercase text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.35)] lg:text-[25px]">${esc(r.name)}</span><span class="btn-gold mt-3 px-[30px] uppercase">Xem thêm</span></span></a>`)
    .join('')}</div></section>`;
}

async function products(s: Settings): Promise<string> {
  const attrs = await getAttributes();
  let out = '';
  for (const n of [1, 2, 3]) {
    const title = mod(s, `ps${n}_title`);
    if (!title) continue;
    const cat = mod(s, `ps${n}_cat`);
    const count = Math.max(1, parseInt(mod(s, `ps${n}_count`), 10) || 8);
    const items = await latestProducts(cat, count);
    if (!items.length) continue;
    const more = n === 3 && on(s, 'ps3_more') && (await latestProducts(cat, count, 2)).length > 0;
    out += `<section class="container-x pb-14 lg:pb-[70px]">${sectionTitle(title, 'h2', 'mb-[18px]')}<div class="product-grid" data-more-grid>${items.map((p) => productCard(p, attrs)).join('')}</div>`;
    if (more) out += `<div class="mt-5 text-center"><button type="button" class="btn-gold-gradient" data-load-more data-cat="${esc(cat)}" data-limit="${count}" data-page="2" data-url="/api/tai-them">Tải thêm</button></div>`;
    out += '</section>';
  }
  return out;
}

function brands(s: Settings): string {
  const list = mods(s, 'brands');
  if (!list.length) return '';
  const item = (src: string, copy: number) => `<div class="marquee__item"${copy ? ' aria-hidden="true"' : ''}><img src="${esc(src)}" class="max-h-[60px] w-auto object-contain" alt="" loading="lazy" decoding="async"></div>`;
  return `<section class="mx-auto max-w-[1440px] px-[15px] pb-[60px]" aria-label="Thương hiệu đối tác"><div class="marquee" style="--count:${list.length}"><div class="marquee__track">${[0, 1].map((c) => list.map((x) => item(x, c)).join('')).join('')}</div></div></section>`;
}

function video(s: Settings): string {
  const vid = youtubeId(mod(s, 'video_url'));
  if (!mod(s, 'video_url')) return '';
  return `<section class="mx-auto max-w-[1440px] px-[15px] pb-0"><button type="button" class="video-banner group" data-video="${esc(vid)}" aria-label="Xem video giới thiệu">${img(mod(s, 'video_image'), 'absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-105', 'loading="lazy"')}<span class="absolute inset-0 bg-[#5c4e31]/60"></span><span class="video-banner__play">${ic('play', 'size-7 translate-x-0.5 fill-current')}</span></button></section>`;
}

async function blog(s: Settings): Promise<string> {
  const posts = await db.post.findMany({ where: { status: 'publish' }, orderBy: { createdAt: 'desc' }, take: Math.max(1, parseInt(mod(s, 'blog_count'), 10) || 8) });
  if (!posts.length) return '';
  return `<section class="arc-section pt-14 pb-16"><div class="container-x relative">${sectionTitle(mod(s, 'blog_title'), 'h2', 'mb-4')}<div class="carousel relative" data-carousel>
<button type="button" class="carousel__arrow carousel__arrow--ring left-3 top-[140px] lg:left-[30px] lg:top-[162px]" data-prev aria-label="Bài trước">${ic('chevron-left', 'size-5')}</button>
<button type="button" class="carousel__arrow carousel__arrow--ring right-3 top-[140px] lg:right-[30px] lg:top-[162px]" data-next aria-label="Bài sau">${ic('chevron-right', 'size-5')}</button>
<div class="carousel__track gap-5" data-track>${posts.map((p) => `<div class="w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">${postCard(p, 'carousel')}</div>`).join('')}</div></div></div></section>`;
}

function press(s: Settings): string {
  const list = mods(s, 'press');
  if (!list.length) return '';
  return `<section class="container-x pb-14">${sectionTitle(mod(s, 'press_title'), 'h2', 'mb-8')}<div class="grid grid-cols-2 items-center gap-8 lg:grid-cols-4">${list.map((src, i) => `<div class="flex h-[120px] items-center justify-center" data-reveal style="--d:${i * 80}ms"><img src="${esc(src)}" class="press-logo max-h-[110px] w-auto max-w-full object-contain sm:max-w-[200px]" alt="" loading="lazy" decoding="async"></div>`).join('')}</div></section>`;
}

function instagram(s: Settings): string {
  const list = mods(s, 'instagram');
  if (!list.length) return '';
  const link = mod(s, 'insta_link');
  return `<section class="arc-section pt-12 pb-[80px]"><div class="container-x">${sectionTitle(mod(s, 'insta_title'), 'h2', 'mb-4')}<div class="carousel relative" data-carousel data-autoplay="4000"><div class="carousel__track gap-5" data-track>${list
    .map((src) => `<a href="${esc(link || src)}" class="insta-item w-[calc(50%-10px)] lg:w-[calc(25%-15px)]" ${link ? 'target="_blank" rel="noopener"' : 'data-lightbox-image'} aria-label="Ảnh Instagram"><img src="${esc(src)}" class="aspect-square size-full object-cover" alt="" loading="lazy" decoding="async"><span class="insta-item__overlay">${ic('instagram', 'size-8')}</span></a>`)
    .join('')}</div></div></div></section>`;
}

export async function homeHtml(s: Settings): Promise<string> {
  const parts = await Promise.all([hero(s), about(s), categories(s), rooms(s), products(s), brands(s), video(s), blog(s), press(s), testimonials(mod(s, 'testi_title')), instagram(s)]);
  return parts.join('\n');
}
