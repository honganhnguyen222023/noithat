import { headers } from 'next/headers';
import { Html } from '@/components/Html';
import { cartCount } from '@/lib/cart';
import { siteFooter, siteHeader } from '@/lib/layout';
import { getSettings } from '@/lib/settings';
import { getCategories } from '@/lib/shop';

// Khung website: đầu trang, nội dung, chân trang (giống header.php + footer.php của theme IRIS).
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const [s, cats, count] = await Promise.all([getSettings(), getCategories(), cartCount()]);
  return (
    <>
      <link rel="stylesheet" href="/css/app.css" precedence="default" />
      <link rel="stylesheet" href="/css/shop.css" precedence="default" />
      <Html html={siteHeader(s, h.get('x-path') || '/', cats, count, h.get('x-search') || '')} />
      <main id="main" className="site-main">
        {children}
      </main>
      <Html html={siteFooter(s)} />
      <script src="/js/app.js" defer />
    </>
  );
}
