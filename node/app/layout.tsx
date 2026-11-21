import type { Metadata, Viewport } from 'next';
import { getSettings, mod } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = mod(s, 'site_name');
  const icon = mod(s, 'favicon');
  return {
    title: { default: `${name} – ${mod(s, 'site_tagline')}`, template: `%s – ${name}` },
    description: mod(s, 'seo_description') || mod(s, 'site_tagline'),
    metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
    icons: icon ? { icon } : undefined,
    openGraph: { siteName: name, locale: 'vi_VN', type: 'website', images: mod(s, 'hero_image') ? [mod(s, 'hero_image')] : undefined },
  };
}

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
