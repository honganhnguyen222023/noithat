import { Html } from '@/components/Html';
import { notFoundHtml } from '@/lib/pages';

export default function NotFound() {
  return <Html html={notFoundHtml()} />;
}
