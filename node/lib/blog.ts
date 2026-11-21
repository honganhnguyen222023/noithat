// Blog: thẻ bài viết, cột bên, mục lục tự động, phản hồi khách hàng
// (viết lại từ template-parts/post-card.php, blog-sidebar.php, home/testimonials.php, inc/helpers.php).
import type { Post } from '@prisma/client';
import { db } from './db';
import { esc, slugify, stripTags, vnDate, words } from './html';
import { ic } from './icons';
import { sectionTitle } from './layout';
import { catUrl, catCounts, getCategories } from './shop';

export const postUrl = (p: Pick<Post, 'slug'>) => `/${encodeURIComponent(p.slug)}/`;
export const excerpt = (p: Pick<Post, 'excerpt' | 'content'>) => (p.excerpt ? stripTags(p.excerpt) : words(p.content, 55));

/** Thẻ bài viết: 'carousel' (thẻ trắng ở trang chủ) | 'grid' (trang blog). */
export function postCard(p: Post, style: 'carousel' | 'grid' = 'grid'): string {
  const card = style === 'carousel';
  const url = postUrl(p);
  return `<article class="${card ? 'post-card post-card--boxed group h-full' : 'post-card group'}" data-reveal><a href="${url}" class="post-card__media" tabindex="-1" aria-hidden="true">${p.image ? `<img src="${esc(p.image)}" class="size-full object-cover transition duration-500 group-hover:scale-105" alt="" loading="lazy" decoding="async">` : ''}</a>
<div class="${card ? 'px-5 pt-6 pb-6' : 'pt-5'}"><h3 class="post-card__title"><a href="${url}">${esc(p.title)}</a></h3>${card ? `<time class="mt-1 block text-xs text-neutral-600" datetime="${p.createdAt.toISOString()}">${vnDate(p.createdAt)}</time>` : ''}
<p class="mt-3 ${card ? 'line-clamp-2' : 'line-clamp-3'} text-[15px] leading-relaxed">${esc(excerpt(p))}</p></div></article>`;
}

export async function blogSidebar(): Promise<string> {
  const [cats, counts, recent] = await Promise.all([getCategories(), catCounts(), db.post.findMany({ where: { status: 'publish' }, orderBy: { createdAt: 'desc' }, take: 5 })]);
  const top = cats.filter((c) => !c.parentId && counts[c.id]).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  let out = '<aside class="space-y-[30px]" aria-label="Cột bên">';
  if (top.length) {
    out += '<section class="sidebar-card"><h2 class="sidebar-title">Danh mục sản phẩm</h2><ul class="space-y-3.5">';
    for (const c of top) {
      const kids = cats.filter((k) => k.parentId === c.id && counts[k.id]);
      out += `<li><div class="flex items-center justify-between gap-2"><a href="${catUrl(c)}" class="hover:text-gold">${esc(c.name)}</a>${kids.length ? `<button type="button" class="p-1" data-acc aria-expanded="false" aria-label="Mở danh mục con">${ic('chevron-down', 'size-4 transition')}</button>` : ''}</div>`;
      if (kids.length) out += `<ul class="mt-2 space-y-2 border-l border-neutral-200 pl-4 text-[15px]" hidden>${kids.map((k) => `<li><a href="${catUrl(k)}" class="hover:text-gold">${esc(k.name)}</a></li>`).join('')}</ul>`;
      out += '</li>';
    }
    out += '</ul></section>';
  }
  if (recent.length) {
    out += `<section class="sidebar-card"><h2 class="sidebar-title">Bài viết mới</h2><ul class="space-y-5">${recent
      .map((p) => `<li><a href="${postUrl(p)}" class="group flex gap-4"><span class="size-[50px] shrink-0 overflow-hidden rounded">${p.image ? `<img src="${esc(p.image)}" class="size-full object-cover" alt="" loading="lazy">` : ''}</span><span class="text-[15px] leading-snug group-hover:text-gold">${esc(p.title)}</span></a></li>`)
      .join('')}</ul></section>`;
  }
  return out + '</aside>';
}

/** Gắn id cho H2/H3 và lập mục lục. */
export function toc(content: string): { html: string; items: { level: number; id: string; text: string }[] } {
  const items: { level: number; id: string; text: string }[] = [];
  const used = new Set<string>();
  const html = content.replace(/<(h[23])([^>]*)>([\s\S]*?)<\/\1>/gi, (full, tag: string, attrs: string, inner: string) => {
    const text = stripTags(inner);
    if (!text) return full;
    const base = slugify(text) || 'muc';
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    items.push({ level: Number(tag[1]), id, text });
    return `<${tag}${attrs.replace(/\sid="[^"]*"/, '')} id="${id}">${inner}</${tag}>`;
  });
  return { html, items };
}

/** Khối "Khách hàng phản hồi" (trang chủ + trang sản phẩm). */
export async function testimonials(title: string, subtitle = ''): Promise<string> {
  const list = await db.testimonial.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }], take: 12 });
  if (!list.length) return '';
  return `<section class="container-x pb-14">${sectionTitle(title, 'h2', 'mb-1')}${subtitle ? `<p class="mb-6 text-center uppercase">${esc(subtitle)}</p>` : ''}
<div class="carousel testimonials relative mt-6" data-carousel data-center data-autoplay="6000"><div class="carousel__track gap-0" data-track>${list
    .map((t) => `<figure class="testimonial w-full shrink-0 sm:w-1/2 lg:w-1/3" data-slide><blockquote class="testimonial__text">${t.content}</blockquote><figcaption class="mt-6 flex items-center gap-4">${t.image ? `<img src="${esc(t.image)}" class="size-[58px] rounded-full object-cover" alt="" loading="lazy">` : ''}<span><span class="block text-lg font-bold text-[#8a6a33]">${esc(t.name)}</span><span class="block text-[15px]">${esc(t.role)}</span></span></figcaption></figure>`)
    .join('')}</div><div class="carousel__dots" data-dots></div></div></section>`;
}
