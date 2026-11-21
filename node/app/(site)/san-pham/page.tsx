import { redirect } from 'next/navigation';

// /san-pham/ → trang cửa hàng.
export default function Products() {
  redirect('/cua-hang/');
}
