// Đầu trang, chân trang, menu, nút liên hệ nổi (viết lại từ header.php, footer.php, inc/menu.php, template-parts/contact-buttons.php).
import type { Category } from '@prisma/client';
import { esc } from './html';
import { ic } from './icons';
import { mapSrc, mod, on, type MenuItem, type Settings, socials, tel, zaloUrl } from './settings';
import { catUrl } from './shop';

const isCurrent = (item: MenuItem, path: string): boolean => {
  const u = item.url.split('#')[0];
  if (u && u !== '/' && u !== '#' && (path === u || path.startsWith(u))) return true;
  return item.children.some((c) => isCurrent(c, path));
};
const target = (it: MenuItem) => (it.target ? ` target="${esc(it.target)}" rel="noopener"` : '');

function desktopMenu(tree: MenuItem[], path: string, cats: Category[], s: Settings, depth = 0): string {
  if (!tree.length) return '';
  let out = depth === 0 ? '<ul class="nav-desktop">' : `<ul class="nav-dropdown${depth > 1 ? ' nav-dropdown--sub' : ''}">`;
  for (const it of tree) {
    const has = it.children.length > 0;
    if (depth === 0 && has && it.children.some((c) => c.object === 'product_cat')) {
      out += megaMenu(it, path, cats, s);
      continue;
    }
    const cls = [has ? 'has-children' : '', isCurrent(it, path) ? 'is-current' : ''].filter(Boolean).join(' ');
    out += `<li class="${cls}"><a href="${esc(it.url)}"${target(it)}>${esc(it.title)}${has ? ic(depth === 0 ? 'chevron-down' : 'chevron-right', 'size-3.5 opacity-60') : ''}</a>`;
    if (has) out += desktopMenu(it.children, path, cats, s, depth + 1);
    out += '</li>';
  }
  return out + '</ul>';
}

let megaN = 0;
/** Menu "Sản phẩm": cột trái là danh mục, di chuột để đổi bảng bên phải (danh mục con + ảnh). */
function megaMenu(item: MenuItem, path: string, cats: Category[], s: Settings): string {
  const uid = 'mega-' + ++megaN;
  const parents = item.children;
  let out = `<li class="has-children has-mega${isCurrent(item, path) ? ' is-current' : ''}"><a href="${esc(item.url)}" aria-haspopup="true">${esc(item.title)}${ic('chevron-down', 'size-3.5 opacity-60')}</a>`;
  out += `<div class="mega" data-mega id="${uid}"><div class="mega__parents" role="tablist" aria-label="${esc(item.title)}">`;
  parents.forEach((p, i) => {
    out += `<a href="${esc(p.url)}" class="mega__parent${i === 0 ? ' is-active' : ''}" role="tab" id="${uid}-t${i}" aria-controls="${uid}-p${i}" aria-selected="${i === 0}" data-mega-tab><span>${esc(p.title)}</span>${ic('chevron-right', 'size-6 shrink-0')}</a>`;
  });
  out += '</div><div class="mega__content">';
  parents.forEach((p, i) => {
    const cat = p.catSlug ? cats.find((c) => c.slug === p.catSlug) : undefined;
    const kids = p.children.length ? p.children : cat ? cats.filter((c) => c.parentId === cat.id).map((c) => ({ title: c.name, url: catUrl(c), children: [] })) : [];
    out += `<section class="mega__panel" id="${uid}-p${i}" role="tabpanel" aria-labelledby="${uid}-t${i}"${i === 0 ? '' : ' hidden'}><div class="min-w-0">`;
    out += `<a href="${esc(p.url)}" class="mega__view-all"><span>${esc(mod(s, 'mega_view_all'))} ${esc(p.title)}</span>${ic('chevron-right', 'size-6 shrink-0')}</a>`;
    if (kids.length) {
      if (mod(s, 'mega_label')) out += `<div class="mega__label">${esc(mod(s, 'mega_label'))}</div>`;
      out += `<div class="mega__children">${kids.map((k) => `<a href="${esc(k.url)}" class="mega__child">${esc(k.title)}</a>`).join('')}</div>`;
    }
    out += '</div><div class="mega__media">';
    if (cat?.image) out += `<a href="${esc(p.url)}" class="mega__image" tabindex="-1" aria-hidden="true"><img src="${esc(cat.image)}" class="h-full w-full object-contain" alt="" loading="lazy" decoding="async"></a>`;
    out += `<a href="${esc(p.url)}" class="mega__collection"><span>${esc(mod(s, 'mega_collection'))} ${esc(p.title)}</span>${ic('chevron-right', 'size-6 shrink-0')}</a></div></section>`;
  });
  return out + '</div></div></li>';
}

function mobileMenu(tree: MenuItem[], path: string, depth = 0): string {
  if (!tree.length) return '';
  let out = `<ul class="${depth ? 'nav-mobile__sub' : 'nav-mobile'}"${depth ? ' hidden' : ''}>`;
  for (const it of tree) {
    const has = it.children.length > 0;
    out += `<li><div class="nav-mobile__row"><a href="${esc(it.url)}" class="${isCurrent(it, path) || (it.url === '/' && path === '/') ? 'text-gold' : ''}">${esc(it.title)}</a>`;
    if (has) out += `<button type="button" class="nav-mobile__toggle" aria-expanded="false" aria-label="Mở menu con ${esc(it.title)}">${ic('chevron-down', 'size-4')}</button>`;
    out += '</div>' + (has ? mobileMenu(it.children, path, depth + 1) : '') + '</li>';
  }
  return out + '</ul>';
}

export function siteHeader(s: Settings, path: string, cats: Category[], cartCount: number, search = ''): string {
  const name = mod(s, 'site_name');
  const logo = mod(s, 'custom_logo');
  const transparent = path === '/';
  const menu = s.menus.primary || [];
  const logoHtml = logo ? `<img src="${esc(logo)}" class="h-[46px] w-auto lg:h-[60px]" alt="${esc(name)}" loading="eager" fetchpriority="high">` : `<span class="text-2xl font-bold tracking-wide">${esc(name)}</span>`;
  return `<a class="skip-link" href="#main">Bỏ qua, tới nội dung chính</a>
<header id="site-header" class="site-header ${transparent ? 'is-transparent' : ''}" data-header>
<div class="container-x flex h-[70px] items-center gap-4 lg:h-[90px]">
<button type="button" class="header-icon -ml-2 lg:hidden" data-drawer-open aria-controls="mobile-drawer" aria-expanded="false" aria-label="Mở menu">${ic('menu', 'size-6')}</button>
<a href="/" class="site-logo max-lg:absolute max-lg:left-1/2 max-lg:-translate-x-1/2" rel="home" aria-label="${esc(name)} – Trang chủ">${logoHtml}</a>
<nav class="hidden flex-1 justify-center lg:flex" aria-label="Menu chính">${desktopMenu(menu, path, cats, s)}</nav>
<div class="ml-auto flex items-center gap-1 lg:ml-0">
<form role="search" method="get" action="/cua-hang/" class="header-search hidden lg:flex"><label class="sr-only" for="header-s">Tìm kiếm</label><input id="header-s" type="search" name="s" placeholder="Tìm kiếm..." value="${esc(search)}"><button type="submit" aria-label="Tìm">${ic('search', 'size-[18px]')}</button></form>
<a href="/tai-khoan/" class="header-icon relative" aria-label="Tài khoản">${ic('user', 'size-6')}</a>
<a href="/gio-hang/" class="header-icon relative -mr-2 lg:mr-0" aria-label="Giỏ hàng">${ic('shopping-bag', 'size-6')}<span class="cart-count${cartCount ? '' : ' hidden'}" data-cart-count>${cartCount}</span></a>
</div></div></header>
<div id="mobile-drawer" class="drawer" data-drawer hidden><div class="drawer__backdrop" data-drawer-close></div>
<div class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu"><div class="flex items-center justify-between border-b border-neutral-200 px-5 py-4"><span class="text-lg font-bold text-gold">Menu</span><button type="button" class="header-icon -mr-2" data-drawer-close aria-label="Đóng menu">${ic('x', 'size-6')}</button></div>
<form role="search" method="get" action="/cua-hang/" class="m-5 flex items-center rounded-full border border-neutral-300 px-4"><label class="sr-only" for="drawer-s">Tìm kiếm</label><input id="drawer-s" type="search" name="s" placeholder="Tìm sản phẩm..." class="h-11 flex-1 bg-transparent outline-none"><button type="submit" aria-label="Tìm">${ic('search', 'size-5')}</button></form>
<nav aria-label="Menu di động" class="px-5 pb-8">${mobileMenu([{ title: 'Trang chủ', url: '/', children: [] }, ...menu, { title: 'Tài khoản', url: '/tai-khoan/', children: [] }], path)}</nav></div></div>`;
}

function footerMenu(items: MenuItem[] = []): string {
  if (!items.length) return '';
  return `<ul class="footer-list">${items.map((it) => `<li><a href="${esc(it.url)}">${esc(it.title)}</a></li>`).join('')}</ul>`;
}

export function siteFooter(s: Settings): string {
  const name = mod(s, 'site_name');
  const light = mod(s, 'logo_light') || mod(s, 'custom_logo');
  const so = socials(s);
  let out = `<footer class="site-footer"><div class="container-x grid gap-10 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1.4fr] lg:gap-8">
<div class="space-y-4 sm:col-span-2 lg:col-span-1"><a href="/" class="inline-block" aria-label="${esc(name)}">${light ? `<img src="${esc(light)}" class="h-[52px] w-auto" alt="${esc(name)}" loading="lazy">` : esc(name)}</a>
<p class="text-[15px] leading-relaxed">${esc(mod(s, 'footer_about'))}</p>
<ul class="space-y-3 text-[15px]"><li class="flex gap-3">${ic('map-pin', 'size-5 shrink-0 mt-0.5')}<span>${esc(mod(s, 'address'))}</span></li><li class="flex gap-3">${ic('phone-call', 'size-5 shrink-0')}<a href="${esc(tel(mod(s, 'phone')))}">${esc(mod(s, 'phone'))}</a></li><li class="flex gap-3">${ic('mail', 'size-5 shrink-0')}<a href="mailto:${esc(mod(s, 'email'))}">${esc(mod(s, 'email'))}</a></li></ul></div>`;
  for (const n of [1, 2, 3] as const) out += `<div><h2 class="footer-title">${esc(mod(s, 'footer_title_' + n))}</h2>${footerMenu(s.menus[`footer-${n}`])}</div>`;
  out += `<div class="sm:col-span-2 lg:col-span-1"><h2 class="footer-title">${esc(mod(s, 'footer_title_map'))}</h2><div class="footer-map" data-lazy-map="${esc(mapSrc(s))}"><button type="button" class="flex size-full flex-col items-center justify-center gap-2 text-sm text-white/80 hover:text-white">${ic('map-pin', 'size-7 text-gold')} Xem bản đồ</button></div></div></div>`;
  out += `<div class="border-t border-white/10"><div class="container-x flex flex-col items-center justify-between gap-3 py-4 text-sm text-white/70 sm:flex-row"><p>${esc(mod(s, 'copyright'))}</p>`;
  if (so.length) out += `<ul class="flex gap-2">${so.map(([k, l, u]) => `<li><a href="${esc(u)}" class="social-btn" target="_blank" rel="noopener" aria-label="${esc(l)}">${ic(k, 'size-4')}</a></li>`).join('')}</ul>`;
  out += '</div></div></footer>';
  out += contactButtons(s);
  out += `<button type="button" class="back-to-top" data-back-to-top aria-label="Lên đầu trang">${ic('arrow-up', 'size-5')}</button>`;
  out += `<div class="lightbox" data-lightbox hidden><button type="button" class="lightbox__close" data-lightbox-close aria-label="Đóng">${ic('x', 'size-7')}</button><div class="lightbox__body" data-lightbox-body></div></div>`;
  return out;
}

function contactButtons(s: Settings): string {
  if (!on(s, 'show_floating')) return '';
  const phone = mod(s, 'phone');
  const zalo = zaloUrl(s);
  const mess = mod(s, 'messenger');
  const contact = '/lien-he/';
  return `<div class="float-contact" aria-label="Liên hệ nhanh">
<a href="${contact}" class="float-contact__btn bg-[#0f3a46] text-white" aria-label="Liên hệ">${ic('square-pen', 'size-5')}<span>Liên hệ</span></a>
<a href="${esc(tel(phone))}" class="float-contact__btn bg-white text-[#e8262d] ring-pulse" aria-label="Gọi điện">${ic('phone', 'size-5')}<span>${esc(phone)}</span></a>
<a href="${esc(zalo)}" class="float-contact__btn bg-[#0068ff] text-white" target="_blank" rel="noopener" aria-label="Chat Zalo">${ic('zalo', 'size-6')}<span>Zalo</span></a>
${mess ? `<a href="${esc(mess)}" class="float-contact__btn bg-[#0a7cff] text-white" target="_blank" rel="noopener" aria-label="Chat Messenger">${ic('messenger', 'size-5')}<span>Messenger</span></a>` : ''}</div>
<nav class="mobile-bar" aria-label="Thanh liên hệ">
<button type="button" data-drawer-open aria-controls="mobile-drawer"><span class="mobile-bar__icon bg-[#1677ff]">${ic('menu', 'size-4')}</span>Menu</button>
<a href="${esc(zalo)}" target="_blank" rel="noopener"><span class="mobile-bar__icon bg-[#0068ff]">${ic('zalo', 'size-5')}</span>Zalo</a>
<a href="${esc(tel(phone))}" class="mobile-bar__call"><span class="mobile-bar__call-btn ring-pulse">${ic('phone', 'size-6')}</span><span class="mobile-bar__call-label">Gọi ngay</span></a>
<a href="${esc(mess || contact)}" target="_blank" rel="noopener"><span class="mobile-bar__icon bg-[#0a7cff]">${ic('messenger', 'size-4')}</span>Messenger</a>
<a href="${contact}"><span class="mobile-bar__icon bg-[#38a3c4]">${ic('square-pen', 'size-4')}</span>Liên hệ</a></nav>`;
}

/** Breadcrumb: [[chữ, link], …] – mục cuối là trang hiện tại. */
export function breadcrumbs(items: [string, string?][], cls = ''): string {
  const all: [string, string?][] = [['Trang chủ', '/'], ...items];
  const last = all.length - 1;
  return `<nav aria-label="Breadcrumb" class="breadcrumbs ${esc(cls)}"><ol class="flex flex-wrap items-center gap-x-3 gap-y-1">${all
    .map(([label, url], i) => `<li class="flex items-center gap-3">${i > 0 ? ic('chevron-right', 'size-3.5 text-neutral-500') : ''}${url && i !== last ? `<a href="${esc(url)}" class="hover:text-gold">${esc(label)}</a>` : `<span class="font-bold text-ink" aria-current="page">${esc(label)}</span>`}</li>`)
    .join('')}</ol></nav>`;
}

export function sectionTitle(title: string, tag = 'h2', extra = ''): string {
  return title.trim() ? `<${tag} class="section-title ${esc(extra)}" data-reveal>${esc(title)}</${tag}>` : '';
}
