# Nội Thất IRIS – bản Node.js (Next.js + Prisma)

Viết lại toàn bộ website và trang quản trị của theme WordPress **IRIS Nội Thất** (WordPress + WooCommerce) bằng Node.js.
Giao diện giữ nguyên như bản WordPress (dùng lại CSS, font, icon, JavaScript của theme).

## Chạy trên máy

- Mac: bấm đúp `Chay-website.command`
- Windows: bấm đúp `Chay-website.bat`
- Hoặc gõ lệnh: `npm install` → `npm run setup` (lần đầu) → `npm run dev`

Website: http://localhost:3000 · Quản trị: http://localhost:3000/quan-tri/

Tài khoản thử: quản trị `admin / admin`, khách hàng `khachhang / khachhang123` (đổi mật khẩu trước khi đưa lên mạng).

## Website

| Trang | Đường dẫn |
|---|---|
| Trang chủ (11 khối: ảnh bìa, giới thiệu, danh mục, không gian, 3 khối sản phẩm, thương hiệu, video, blog, báo chí, phản hồi, Instagram) | `/` |
| Cửa hàng, tìm kiếm | `/cua-hang/`, `/cua-hang/?s=sofa` |
| Danh mục (banner, danh mục con, lọc giá / màu / chất liệu, sắp xếp) | `/danh-muc-san-pham/<tên>/` |
| Sản phẩm (ảnh, chọn mẫu màu, thêm giỏ, Mua ngay, tab mô tả / thông số) | `/san-pham/<tên>/` |
| Giỏ hàng, thanh toán (COD, chuyển khoản có mã QR) | `/gio-hang/`, `/thanh-toan/` |
| Tài khoản khách (đăng nhập, đăng ký, đơn hàng, đổi thông tin, quên mật khẩu) | `/tai-khoan/` |
| Blog, chuyên mục, bài viết (mục lục tự động) | `/blog/`, `/category/<tên>/`, `/<bài-viết>/` |
| Giới thiệu, Liên hệ (form + bản đồ), các trang chính sách | `/gioi-thieu/`, `/lien-he/`, `/<trang>/` |

## Quản trị `/quan-tri/`

Tổng quan · Đơn hàng (xác nhận, giao hàng, phí ship, đã nhận tiền, ghi chú, xóa) · Sản phẩm (mẫu màu / chất liệu, nhiều ảnh, soạn mô tả) ·
Danh mục (ảnh, banner) · Màu sắc, chất liệu · Khách hàng (đổi mật khẩu, xóa) · Bài viết blog · Trang · Phản hồi khách hàng ·
Tin nhắn liên hệ · Nội dung website (như Giao diện → Tùy biến) · Menu · Thanh toán & tài khoản quản trị · Tài khoản của tôi.

## Cấu trúc

- `app/(site)/` – các trang website · `app/quan-tri/` – trang quản trị · `app/api/form/` – nhận form của khách
- `lib/` – xử lý: `home.ts`, `catalog.ts`, `product.ts`, `shop-pages.ts`, `pages.ts`, `layout.ts`, `settings.ts`, `cart.ts`, `orders.ts`, `actions.ts`
- `lib/admin/` – trang quản trị · `public/css/app.css`, `public/js/app.js` – CSS / JS của theme IRIS
- `prisma/schema.prisma` – cơ sở dữ liệu (SQLite trên máy, đổi sang PostgreSQL khi lên server)
- `data/iris-export.json` + `public/uploads/` – dữ liệu và ảnh chuyển từ bản WordPress (`npm run import:data` nạp lại)
- `scripts/convert-wordpress.mjs` – công cụ chuyển dữ liệu từ file SQL của WordPress (đã chạy sẵn)

## Đưa lên server

Cần VPS / dịch vụ chạy được Node.js 18+. Sửa `.env` (SITE_URL, APP_SECRET, SMTP…), chạy `npm install`, `npm run setup`, `npm run build`, `npm start`
(nên dùng pm2 và Nginx phía trước). Muốn dùng PostgreSQL: đổi `provider` trong `prisma/schema.prisma` và `DATABASE_URL`.
