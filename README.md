# Website Nội Thất IRIS – WordPress + Tailwind CSS

Theme WordPress dựng lại giao diện mẫu [webnoithat.giaodien.asia](https://webnoithat.giaodien.asia) bằng **Tailwind CSS v4**, **WooCommerce** và icon **Lucide**. Theme có đủ trang chủ, danh mục, chi tiết sản phẩm, blog, giới thiệu, liên hệ và chạy tốt trên điện thoại. Kèm theo dữ liệu mẫu, nhập bằng 1 cú bấm.

> ⚠️ Ảnh và nội dung mẫu được lấy từ trang demo để **học/thử nghiệm**. Trước khi chạy website thật, hãy thay bằng ảnh và nội dung của bạn.

> **Bản Node.js (Next.js + Prisma)** của website này nằm trong thư mục [`node/`](node/): viết lại cả website và trang quản trị, chạy độc lập không cần WordPress, giữ nguyên giao diện IRIS. Xem [`node/README.md`](node/README.md), [`node/HUONG-DAN-CHAY-WINDOWS.md`](node/HUONG-DAN-CHAY-WINDOWS.md), [`node/HUONG-DAN-QUAN-TRI.md`](node/HUONG-DAN-QUAN-TRI.md).

---

## Mục lục
1. [Xem thử ngay trên trình duyệt (không cần cài gì)](#1-xem-thử-ngay-trên-trình-duyệt)
2. [Cài lên hosting WordPress thật](#2-cài-lên-hosting-wordpress-thật)
3. [Hướng dẫn quản trị cho khách hàng (không cần biết code)](#3-hướng-dẫn-quản-trị-cho-khách-hàng)
4. [Lập trình trên máy với VS Code + Claude Code](#4-lập-trình-trên-máy-với-vs-code--claude-code)
5. [Cài skill cho Claude Code](#5-cài-skill-cho-claude-code)
6. [Cấu trúc thư mục](#6-cấu-trúc-thư-mục)
7. [Tốc độ & SEO](#7-tốc-độ--seo)

---

## 1. Xem thử ngay trên trình duyệt

Bấm link dưới đây. WordPress Playground sẽ tự cài WordPress, WooCommerce, theme IRIS và dữ liệu mẫu ngay trong trình duyệt của bạn (mất khoảng 1–2 phút):

👉 **https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/honganhnguyen222023/noithat/main/blueprint.json**

- Bản chạy thử chỉ nằm trong trình duyệt của bạn. Đóng tab là mất, không ảnh hưởng gì.
- Bạn đã được đăng nhập sẵn. Vào `/wp-admin` để thử các thao tác quản trị.
- Repo phải để **Public** thì link mới chạy được.

---

## 2. Cài lên hosting WordPress thật

**Bước 1 – Chuẩn bị:** hosting có WordPress 6.5+ và PHP 8.0+.

**Bước 2 – Cài WooCommerce:** vào trang quản trị → **Plugin → Cài mới**, tìm "WooCommerce" → **Cài đặt** → **Kích hoạt**. Có thể bỏ qua trình hướng dẫn cài đặt của WooCommerce.

**Bước 3 – Tải theme:** tải file [`dist/iris.zip`](dist/iris.zip) trong repo này về máy (bấm vào file → nút **Download**).

**Bước 4 – Cài theme:** **Giao diện → Giao diện → Thêm mới → Tải giao diện lên** → chọn `iris.zip` → **Cài đặt** → **Kích hoạt**.

**Bước 5 – Nhập dữ liệu mẫu:** **Giao diện → Nhập dữ liệu mẫu** → bấm **Nhập dữ liệu mẫu ngay** và chờ khoảng 1–2 phút.

**Bước 6 – Kiểm tra đường dẫn:** **Cài đặt → Đường dẫn tĩnh** → bấm **Lưu thay đổi** một lần.

Xong! Mở trang chủ để xem kết quả.

> Nên cài thêm: một plugin cache (LiteSpeed Cache / WP Super Cache) để web nhanh hơn, và Rank Math hoặc Yoast nếu muốn SEO nâng cao. Theme tự tắt phần SEO cơ bản của mình khi phát hiện 2 plugin này.

---

## 3. Hướng dẫn quản trị cho khách hàng

| Muốn sửa… | Vào đâu trong trang quản trị |
|---|---|
| Ảnh bìa, chữ, các khối trang chủ | **Giao diện → Tùy biến → IRIS – Nội dung website** (xem trước ngay, bấm **Đăng** để lưu) |
| Số điện thoại, Zalo, Messenger, địa chỉ, email, bản đồ | **Tùy biến → IRIS – Nội dung website → Thông tin liên hệ & mạng xã hội** |
| Logo | **Tùy biến → Nhận dạng trang** (logo chính) và **Đầu trang & chân trang** (logo nền tối) |
| Thêm/sửa sản phẩm, giá, giá khuyến mãi | **Sản phẩm → Thêm mới**. Sản phẩm nhiều màu: chọn "Sản phẩm có biến thể", thuộc tính **Màu sắc**, mỗi biến thể gắn 1 ảnh (ảnh sẽ thành ô chọn màu) |
| Danh mục + banner đầu trang danh mục | **Sản phẩm → Danh mục** → sửa danh mục → các ô **Banner – tiêu đề / mô tả / ảnh**. Ảnh tròn ở trang chủ = **Ảnh thu nhỏ** của danh mục. Kéo thả để đổi thứ tự |
| 3 khối sản phẩm trên trang chủ | **Tùy biến → Trang chủ: Các khối sản phẩm** (chọn danh mục, số lượng) |
| Khuyến mãi, chính sách ở trang sản phẩm | **Tùy biến → Trang chi tiết sản phẩm** (mỗi dòng một ý) |
| Phản hồi khách hàng | Menu **Phản hồi KH** (tên = tiêu đề, nội dung = lời nhận xét, ảnh đại diện, chức danh) |
| Xem tin nhắn khách gửi | Menu **Tin nhắn liên hệ** (số tin mới hiện ngay cạnh menu; tin cũng được gửi về email) |
| Bài viết blog | **Bài viết → Viết bài mới**. Mục lục "Nội dung" tự tạo từ các tiêu đề H2/H3 |
| Menu đầu trang & chân trang | **Giao diện → Menu** (4 vị trí: Menu chính, 3 cột chân trang) |
| Trang Giới thiệu / Liên hệ | **Tùy biến → Trang Giới thiệu / Trang Liên hệ** |

---

## 4. Lập trình trên máy với VS Code + Claude Code

### 4.1 Cài công cụ (một lần)
- [Node.js LTS](https://nodejs.org) – để build Tailwind.
- [VS Code](https://code.visualstudio.com) + tiện ích **Claude Code**. Thêm **Tailwind CSS IntelliSense** để được gợi ý tên class.
- WordPress chạy trên máy:
  - **Windows / Mac (dễ nhất):** [LocalWP](https://localwp.com) → tạo site mới → cài plugin WooCommerce.
  - **Mac/Linux có PHP:** chạy `bash tools/local-wp.sh` (tự cài WordPress + WooCommerce + theme + dữ liệu mẫu ở `http://localhost:8080`, tài khoản `admin` / `admin123`).

### 4.2 Lấy code
```bash
git clone https://github.com/honganhnguyen222023/noithat.git
```
```bash
cd noithat
```
```bash
npm install
```

### 4.3 Nối theme vào WordPress trên máy (LocalWP)
Theme nằm ở thư mục `iris/`. Tạo liên kết để sửa code là WordPress thấy ngay:
- **Mac:**
  ```bash
  ln -s "$PWD/iris" "$HOME/Local Sites/<ten-site>/app/public/wp-content/themes/iris"
  ```
- **Windows (PowerShell chạy quyền Administrator):**
  ```bash
  New-Item -ItemType Junction -Path "$HOME\Local Sites\<ten-site>\app\public\wp-content\themes\iris" -Target "$PWD\iris"
  ```
Sau đó: **Giao diện → Kích hoạt IRIS Nội Thất** → **Giao diện → Nhập dữ liệu mẫu**.

### 4.4 Sửa giao diện
```bash
npm run dev
```
Lệnh trên build lại CSS mỗi khi bạn lưu file. Sửa xong thì chạy lệnh dưới để build bản nén CSS, JS và icon:
```bash
npm run build
```
Tạo file zip để tải lên hosting:
```bash
npm run zip
```

### 4.5 Làm việc với Claude Code
Mở thư mục `noithat` trong VS Code → mở Claude Code. Claude sẽ tự đọc `CLAUDE.md` (vai trò Design Coder + Project Manager, các ràng buộc của dự án) và 2 skill trong `.claude/skills/`. Ví dụ yêu cầu:
- *"Thêm khối 'Dự án đã thi công' vào trang chủ, khách tự thêm ảnh được trong Tùy biến."*
- *"Đổi màu chủ đạo sang xanh rêu, kiểm tra lại độ tương phản."*
- *"Review giao diện trang sản phẩm trên mobile theo checklist ui-ux-pro-max."*

### 4.6 Đẩy code lên GitHub
```bash
git add -A
```
```bash
git commit -m "Mô tả thay đổi"
```
```bash
git push
```

---

## 5. Cài skill cho Claude Code

Repo đã có sẵn 2 skill **trong dự án** (`.claude/skills/`). Mở repo này bằng Claude Code (trên máy hay trên web) là dùng được ngay:
- `ui-ux-pro-max` – kho kiến thức UI/UX (phong cách, bảng màu, font, 120 quy tắc UX, checklist). Mã nguồn MIT từ [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill). Cần Python 3 để chạy script tìm kiếm.
- `wordpress-iris` – quy tắc và cấu trúc riêng của theme này.

**Muốn dùng UI/UX Pro Max cho mọi dự án (cài global trên máy):**
```bash
npm install -g ui-ux-pro-max-cli
```
```bash
uipro init --ai claude --global
```
Cài global chỉ có hiệu lực trên máy đã cài. Sang máy khác (Mac ↔ Windows) phải chạy lại 2 lệnh trên.

**Về Lucide và hiệu ứng:** không cần MCP. Icon Lucide được chép thẳng vào `iris/assets/icons/` (thêm icon trong `tools/build-icons.mjs`). Hiệu ứng (hiện dần khi cuộn, hover, carousel, chạy logo, lightbox video) được viết bằng CSS và JS thuần trong theme nên nhẹ và không phụ thuộc thư viện ngoài.

---

## 6. Cấu trúc thư mục
```
noithat/
├── iris/                    ← THEME (zip thư mục này để cài)
│   ├── inc/                 ← PHP: cài đặt, tùy biến, WooCommerce, SEO, nhập dữ liệu mẫu
│   ├── template-parts/home/ ← 11 khối trang chủ (mỗi khối 1 file)
│   ├── woocommerce/         ← trang danh mục + chi tiết sản phẩm
│   ├── page-templates/      ← Trang giới thiệu, Trang liên hệ
│   ├── assets/css/src.css   ← Tailwind (sửa ở đây) → app.css (file build)
│   ├── assets/js/app.js     ← JS thuần → app.min.js (file build)
│   ├── assets/icons/        ← icon Lucide
│   ├── assets/fonts/        ← font Be Vietnam Pro (tự host)
│   └── demo/                ← dữ liệu mẫu + ảnh WebP
├── dist/iris.zip            ← bản đóng gói sẵn để tải lên WordPress
├── blueprint.json           ← cấu hình chạy thử trên WordPress Playground
├── tools/                   ← script build icon, zip, dựng WordPress thử
├── .claude/skills/          ← skill cho Claude Code
└── CLAUDE.md                ← hướng dẫn cho Claude Code
```

## 7. Tốc độ & SEO
- CSS chỉ ~17 KB sau khi nén gzip, JS ~4 KB, không dùng jQuery ở trang chủ và blog. Font và icon đều tự host, không gọi CDN.
- Ảnh WebP, tự tải chậm (lazy), ảnh bìa được tải trước. Bản đồ Google và video YouTube chỉ tải khi cần.
- Mỗi trang có 1 thẻ H1. Có thẻ meta description, Open Graph, canonical, schema `FurnitureStore`, `BreadcrumbList`, và schema Product của WooCommerce.
- Lighthouse khi chạy thử (máy chủ PHP thử nghiệm, chưa nén gzip): SEO 100, Best Practices 100, Accessibility 95.
- Tôn trọng cài đặt "giảm chuyển động" của hệ điều hành.
