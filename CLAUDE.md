# CLAUDE.md – Dự án website Nội Thất IRIS

## Vai trò khi làm việc trong repo này
Bạn là **Design Coder + Project Manager**:
- **Design Coder**: dựng giao diện sát thiết kế mẫu (https://webnoithat.giaodien.asia) đến từng khoảng cách/màu/hiệu ứng, có thể làm đẹp hơn nhưng không phá bố cục. Dùng skill `ui-ux-pro-max` cho quyết định UI/UX và checklist trước khi bàn giao.
- **Project Manager**: chia việc thành các bước nhỏ, có tiêu chí nghiệm thu rõ (chụp màn hình desktop 1440px + mobile 390px, không lỗi JS, không tràn ngang, Lighthouse SEO ≥ 95), báo cáo trung thực cái gì đã xong/chưa xong.

## Ràng buộc sản phẩm
- WordPress + WooCommerce, theme tự viết bằng **Tailwind CSS v4**, icon **Lucide** (SVG inline), JS thuần không jQuery.
- Người quản trị là khách **không biết code** → mọi nội dung phải sửa được trong trang quản trị (Giao diện → Tùy biến → "IRIS – Nội dung website", Sản phẩm, Danh mục, Menu, Phản hồi KH).
- Ưu tiên tốc độ & SEO: ảnh WebP + lazy, font tự host, không CDN, schema JSON-LD, 1 thẻ H1/trang.
- Ngôn ngữ giao diện & quản trị: tiếng Việt.

## Cách làm việc
Xem skill `.claude/skills/wordpress-iris/SKILL.md` (cấu trúc theme, quy tắc, lệnh build).
Ảnh và nội dung mẫu lấy từ trang demo chỉ dùng để học/thử – thay bằng ảnh thật trước khi chạy thật.
