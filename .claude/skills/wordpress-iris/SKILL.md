---
name: wordpress-iris
description: Cách làm việc với theme WordPress "IRIS Nội Thất" trong repo này (Tailwind CSS v4 + WooCommerce + Lucide). Dùng khi sửa giao diện, thêm khối trang chủ, thêm ô tùy biến cho khách, sửa trang sản phẩm/danh mục/blog, chạy WordPress thử, nhập dữ liệu mẫu, build CSS/JS hoặc đóng gói theme.
---

# WordPress – theme IRIS

## Cấu trúc
- `iris/` – chính là theme (thư mục này được copy/zip vào `wp-content/themes/iris`).
  - `inc/customizer.php` – **mọi** chữ/ảnh khách có thể sửa được khai báo 1 lần trong `iris_customizer_fields()`. Đọc giá trị bằng `iris_mod( 'key' )`, gallery bằng `iris_ids( 'key' )`.
  - `template-parts/home/*.php` – mỗi khối trang chủ 1 file; thứ tự trong `front-page.php`.
  - `woocommerce/archive-product.php`, `woocommerce/single-product.php` – trang danh mục & chi tiết sản phẩm.
  - `inc/woocommerce.php` – thẻ sản phẩm `iris_product_card()`, banner danh mục (term meta), nút Mua ngay, bộ lọc.
  - `inc/demo-import.php` + `demo/data.json` + `demo/images/` – dữ liệu mẫu (`wp iris import-demo` hoặc Giao diện → Nhập dữ liệu mẫu).
  - `assets/css/src.css` – nguồn Tailwind v4 (token màu trong `@theme`). `assets/css/app.css` là file build – **không sửa tay**.
  - `assets/js/app.js` – JS thuần, không jQuery. `app.min.js` là file build.
  - `assets/icons/` – icon Lucide (SVG). Thêm icon: thêm tên vào `tools/build-icons.mjs` rồi `npm run build`; dùng `iris_icon( 'ten-icon', 'size-5' )`.

## Quy tắc
1. Khách hàng không biết code → nội dung mới phải sửa được trong trang quản trị (Customizer, WooCommerce, menu, bài viết). Không hard-code chữ trong template; thêm field vào `iris_customizer_fields()`.
2. Escape mọi output (`esc_html`, `esc_url`, `esc_attr`, `wp_kses_post`). Kiểm tra nonce + quyền khi xử lý form.
3. Chuỗi tiếng Việt + regex: luôn dùng cờ `u` (`preg_split( '/\R/u', … )`) – thiếu `u` sẽ cắt hỏng chữ có dấu (vd "Miễn").
4. Tailwind v4: không `@apply` class thành phần (`group`, `btn-gold`…) và không ghép tên class động (`'line-clamp-' . $n`) – viết đủ tên class.
5. Ảnh: dùng `iris_img()` (lazy, srcset). Ảnh trên màn hình đầu tiên: `'loading' => 'eager', 'fetchpriority' => 'high'`.
6. Hiệu ứng: thêm `data-reveal` (hoặc `data-reveal="left|zoom"`, độ trễ `style="--d:120ms"`). Luôn tôn trọng `prefers-reduced-motion` (đã có sẵn trong CSS).
7. Sau khi sửa PHP/CSS/JS: `npm run build`, rồi kiểm tra desktop 1440px + mobile 390px, không tràn ngang.

## Lệnh hay dùng
```bash
npm install          # lần đầu
npm run dev          # build CSS liên tục khi đang sửa
npm run build        # build CSS + JS + icon (trước khi commit)
npm run zip          # tạo dist/iris.zip để tải lên WordPress
bash tools/local-wp.sh   # (Mac/Linux) dựng WordPress thử ở http://localhost:8080
```
