import { Html } from '@/components/Html';
import { homeHtml } from '@/lib/home';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

// Trang chủ (giống front-page.php): nội dung sửa ở Quản trị → Nội dung website.
export default async function Home() {
  return <Html html={await homeHtml(await getSettings())} />;
}
