/* IRIS theme – front-end behaviour. Vanilla JS, no dependencies. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky header ---------- */
  const header = $('[data-header]');
  const backTop = $('[data-back-to-top]');
  const onScroll = () => {
    const y = scrollY;
    header?.classList.toggle('is-scrolled', y > 40);
    backTop?.classList.toggle('is-visible', y > 600);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));

  /* ---------- Mobile drawer ---------- */
  const drawer = $('[data-drawer]');
  let lastFocus = null;
  const openDrawer = () => {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    $$('[data-drawer-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
    $('[data-drawer-close]', drawer.querySelector('.drawer__panel'))?.focus();
  };
  const closeDrawer = () => {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    document.body.style.overflow = '';
    $$('[data-drawer-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    setTimeout(() => { drawer.hidden = true; }, 300);
    lastFocus?.focus();
  };
  $$('[data-drawer-open]').forEach((b) => b.addEventListener('click', openDrawer));
  $$('[data-drawer-close]').forEach((b) => b.addEventListener('click', closeDrawer));

  // Accordions: mobile menu, sidebar categories
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.nav-mobile__toggle, [data-acc]');
    if (!t) return;
    const li = t.closest('li');
    const sub = li && [...li.children].find((el) => el.tagName === 'UL');
    if (!sub) return;
    const open = t.getAttribute('aria-expanded') !== 'true';
    t.setAttribute('aria-expanded', String(open));
    sub.hidden = !open;
    const ic = t.querySelector('svg');
    if (ic && t.hasAttribute('data-acc')) ic.style.transform = open ? 'rotate(180deg)' : '';
  });
  $$('[data-acc][aria-expanded=true] svg').forEach((s) => { s.style.transform = 'rotate(180deg)'; });

  /* ---------- Shop filter drawer (mobile) ---------- */
  const panel = $('[data-filter-panel]');
  const backdrop = $('.filter-backdrop');
  const toggleFilter = (open) => {
    if (!panel) return;
    panel.classList.toggle('is-open', open);
    if (backdrop) backdrop.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  };
  $$('[data-filter-open]').forEach((b) => b.addEventListener('click', () => toggleFilter(true)));
  $$('[data-filter-close]').forEach((b) => b.addEventListener('click', () => toggleFilter(false)));

  /* ---------- Reveal on scroll ---------- */
  // Everything whose top edge is above the bottom of the screen is shown – also when the visitor
  // jumps down the page quickly (anchor links, "back" button, fast scroll).
  let pending = $$('[data-reveal]');
  let ticking = false;
  const reveal = () => {
    ticking = false;
    const limit = innerHeight * 0.94;
    pending = pending.filter((el) => {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!pending.length) removeEventListener('scroll', onRevealScroll);
  };
  const onRevealScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(reveal); } };
  if (reduced) pending.forEach((el) => el.classList.add('is-in'));
  else { addEventListener('scroll', onRevealScroll, { passive: true }); addEventListener('resize', onRevealScroll); reveal(); }
  window.irisReveal = (els) => { pending.push(...els); onRevealScroll(); };

  /* ---------- Carousels ---------- */
  $$('[data-carousel]').forEach((root) => {
    const track = $('[data-track]', root);
    if (!track) return;
    const prev = $('[data-prev]', root);
    const next = $('[data-next]', root);
    const dotsWrap = $('[data-dots]', root);
    const slides = [...track.children];
    const center = root.hasAttribute('data-center');
    const step = () => (slides[0]?.getBoundingClientRect().width || track.clientWidth) + parseFloat(getComputedStyle(track).columnGap || 0);
    const maxScroll = () => track.scrollWidth - track.clientWidth - 2;

    const go = (dir) => {
      const atEnd = track.scrollLeft >= maxScroll();
      const atStart = track.scrollLeft <= 2;
      if (dir > 0 && atEnd) track.scrollTo({ left: 0 });
      else if (dir < 0 && atStart) track.scrollTo({ left: track.scrollWidth });
      else track.scrollBy({ left: dir * step() });
    };
    prev?.addEventListener('click', () => go(-1));
    next?.addEventListener('click', () => go(1));

    let dots = [];
    const activeIndex = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      slides.forEach((s, i) => {
        const c = s.offsetLeft - track.offsetLeft + s.offsetWidth / 2;
        const d = Math.abs(c - mid);
        if (d < dist) { dist = d; best = i; }
      });
      return best;
    };
    if (dotsWrap) {
      dots = slides.map((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', `Tới mục ${i + 1}`);
        b.addEventListener('click', () => {
          const s = slides[i];
          const left = center ? s.offsetLeft - track.offsetLeft - (track.clientWidth - s.offsetWidth) / 2 : s.offsetLeft - track.offsetLeft;
          track.scrollTo({ left });
        });
        dotsWrap.append(b);
        return b;
      });
    }
    const update = () => {
      if (center || dots.length) {
        const a = activeIndex();
        slides.forEach((s, i) => s.classList.toggle('is-active', i === a));
        dots.forEach((d, i) => d.setAttribute('aria-current', String(i === a)));
      }
    };
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    if (center && slides.length > 2 && innerWidth >= 1024) {
      // start with the 2nd slide centred, like the reference site
      requestAnimationFrame(() => { track.scrollLeft = slides[1].offsetLeft - track.offsetLeft - (track.clientWidth - slides[1].offsetWidth) / 2; update(); });
    }
    update();

    const delay = parseInt(root.dataset.autoplay || '0', 10);
    if (delay && !reduced && track.scrollWidth > track.clientWidth + 4) {
      let timer = null;
      let visible = false;
      const start = () => { stop(); if (visible) timer = setInterval(() => go(1), delay); };
      const stop = () => clearInterval(timer);
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; start(); }).observe(root);
      root.addEventListener('pointerenter', stop);
      root.addEventListener('pointerleave', start);
      root.addEventListener('focusin', stop);
    }
  });

  /* ---------- Lightbox (video + images) ---------- */
  const lb = $('[data-lightbox]');
  const lbBody = $('[data-lightbox-body]');
  const openLightbox = (html) => {
    if (!lb) return;
    lbBody.innerHTML = html;
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    $('[data-lightbox-close]', lb).focus();
  };
  const closeLightbox = () => {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    lbBody.innerHTML = '';
    document.body.style.overflow = '';
  };
  lb?.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-lightbox-close]')) closeLightbox(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeLightbox(); closeDrawer(); toggleFilter(false); } });

  $$('[data-video]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.video;
    if (!id) return;
    openLightbox(`<div class="aspect-video w-full overflow-hidden rounded-lg bg-black"><iframe class="size-full" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0" title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`);
  }));
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lightbox-image]');
    if (!a) return;
    e.preventDefault();
    openLightbox(`<img src="${a.getAttribute('href')}" alt="">`);
  });

  /* ---------- Lazy Google map (loads only when scrolled near) ---------- */
  $$('[data-lazy-map]').forEach((box) => {
    const load = () => {
      if (box.dataset.loaded) return;
      box.dataset.loaded = '1';
      box.innerHTML = `<iframe src="${box.dataset.lazyMap}" class="size-full min-h-[inherit] border-0" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Bản đồ"></iframe>`;
    };
    box.addEventListener('click', load, { once: true });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { load(); io.disconnect(); } }, { rootMargin: '200px' });
      io.observe(box);
    }
  });

  /* ---------- Home: "Tải thêm" products ---------- */
  $$('[data-load-more]').forEach((btn) => btn.addEventListener('click', async () => {
    const grid = btn.closest('section').querySelector('[data-more-grid]');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Đang tải...';
    try {
      const url = `${btn.dataset.url}?action=iris_more&cat=${btn.dataset.cat}&limit=${btn.dataset.limit}&page=${btn.dataset.page}`;
      const res = await fetch(url, { credentials: 'same-origin' });
      const data = await res.json();
      const tmp = document.createElement('div');
      tmp.innerHTML = data.html;
      [...tmp.children].forEach((el) => { grid.append(el); requestAnimationFrame(() => el.classList.add('is-in')); });
      $$('img', grid).forEach((img) => { img.loading = 'eager'; });
      btn.dataset.page = String(+btn.dataset.page + 1);
      if (!data.more) btn.parentElement.remove();
    } catch (err) {
      btn.textContent = label;
    }
    btn.disabled = false;
    if (btn.isConnected) btn.textContent = label;
  }));

  /* ---------- Read more (category description) ---------- */
  $$('[data-readmore]').forEach((box) => {
    const body = $('[data-readmore-body]', box);
    const btn = $('[data-readmore-btn]', box);
    if (body.scrollHeight <= body.clientHeight + 10) { btn.remove(); box.classList.add('is-open'); return; }
    btn.addEventListener('click', () => {
      const open = !box.classList.contains('is-open');
      box.classList.toggle('is-open', open);
      btn.textContent = open ? 'Thu gọn' : 'Xem thêm';
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Blog: table of contents toggle ---------- */
  $$('[data-toc-toggle]').forEach((b) => b.addEventListener('click', () => {
    const list = $('[data-toc-list]', b.closest('[data-toc]'));
    list.hidden = !list.hidden;
    b.setAttribute('aria-expanded', String(!list.hidden));
  }));

  /* ---------- Product page ---------- */
  const gallery = $('[data-gallery]');
  let mainImg = gallery && $('[data-main]', gallery);
  const setMain = (src, full) => {
    if (!mainImg || !src) return;
    mainImg.style.opacity = '0';
    const img = new Image();
    img.onload = () => { mainImg.src = src; mainImg.removeAttribute('srcset'); mainImg.dataset.full = full || src; mainImg.style.opacity = '1'; };
    img.src = src;
  };
  if (gallery) {
    $$('[data-thumb]', gallery).forEach((t) => t.addEventListener('click', () => {
      $$('[data-thumb]', gallery).forEach((x) => x.classList.toggle('is-active', x === t));
      setMain(t.dataset.thumb, t.dataset.full);
    }));
    $('[data-zoom]', gallery)?.addEventListener('click', () => {
      const active = $('[data-thumb].is-active', gallery);
      openLightbox(`<img src="${mainImg?.dataset.full || active?.dataset.full || mainImg?.src}" alt="">`);
    });
  }

  // Tabs
  $$('[data-tabs]').forEach((root) => {
    const tabs = $$('[data-tab]', root);
    const select = (tab) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute('aria-selected', String(on));
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          n.focus(); select(n);
        }
      });
    });
  });

  // Quantity +/- buttons
  $$('.product-cart .quantity').forEach((q) => {
    const input = $('input.qty', q);
    if (!input || input.type === 'hidden') return;
    const mk = (txt, d) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'qty-btn';
      b.textContent = txt;
      b.setAttribute('aria-label', d > 0 ? 'Tăng số lượng' : 'Giảm số lượng');
      b.addEventListener('click', () => {
        const min = parseFloat(input.min) || 1;
        const max = parseFloat(input.max) || Infinity;
        input.value = String(Math.min(max, Math.max(min, (parseFloat(input.value) || min) + d)));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      return b;
    };
    q.prepend(mk('-', -1));
    q.append(mk('+', 1));
  });

  // Variation swatches: turn WooCommerce <select>s into buttons (with the variation photo when available)
  $$('form.variations_form').forEach((form) => {
    let variations = [];
    try { variations = JSON.parse(form.dataset.product_variations || '[]'); } catch (e) { variations = []; }
    $$('.variations select', form).forEach((select) => {
      const attr = select.name;
      const wrap = document.createElement('div');
      wrap.className = 'iris-swatches';
      wrap.setAttribute('role', 'group');
      const buttons = [];
      [...select.options].filter((o) => o.value).forEach((opt) => {
        const v = variations.find((x) => x.attributes[attr] === opt.value && x.image && x.image.thumb_src);
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.value = opt.value;
        b.setAttribute('aria-pressed', String(select.value === opt.value));
        b.innerHTML = v ? `<img src="${v.image.thumb_src}" alt="">${opt.text}` : `<span class="no-img">${opt.text}</span>`;
        b.addEventListener('click', () => {
          select.value = select.value === opt.value ? '' : opt.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          if (window.jQuery) window.jQuery(select).trigger('change');
          sync();
        });
        wrap.append(b);
        buttons.push(b);
      });
      const sync = () => buttons.forEach((b) => {
        b.setAttribute('aria-pressed', String(select.value === b.dataset.value));
        const opt = [...select.options].find((o) => o.value === b.dataset.value);
        b.disabled = !opt || opt.disabled;
      });
      select.after(wrap);
      form.addEventListener('change', sync);
      if (window.jQuery) window.jQuery(form).on('woocommerce_update_variation_values reset_data', sync);
    });
    if (window.jQuery) {
      window.jQuery(form).on('found_variation', (e, v) => { if (v.image && v.image.src) setMain(v.image.src, v.image.full_src); });
    }
  });

  // AJAX add-to-cart feedback on category pages (WooCommerce fires this via jQuery)
  if (window.jQuery) {
    window.jQuery(document.body).on('added_to_cart', (e, fragments) => {
      if (fragments) Object.entries(fragments).forEach(([sel, html]) => $$(sel).forEach((el) => { el.outerHTML = html; }));
    });
  }
})();
