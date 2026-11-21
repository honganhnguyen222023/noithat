# Hướng dẫn sử dụng trang quản trị – Nội Thất IRIS

Cập nhật: 21/11/2026

Mở **http://localhost:3000/quan-tri/** (khi đưa lên mạng: `https://ten-mien-cua-ban/quan-tri/`).
Đăng nhập bằng tên đăng nhập (hoặc email) và mật khẩu quản trị. Tài khoản thử: `admin` / `admin`.

Trang quản trị dùng tốt trên cả máy tính và điện thoại. Trên điện thoại, bấm nút ☰ ở góc trên để mở menu.

> **Việc đầu tiên nên làm:** vào **Tài khoản của tôi** đổi tên đăng nhập và mật khẩu admin, rồi vào **Thanh toán & cài đặt** nhập tài khoản ngân hàng nhận tiền.

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Đơn hàng](#2-đơn-hàng)
3. [Sản phẩm](#3-sản-phẩm)
4. [Danh mục](#4-danh-mục)
5. [Màu sắc, chất liệu](#5-màu-sắc-chất-liệu)
6. [Khách hàng](#6-khách-hàng)
7. [Bài viết blog](#7-bài-viết-blog)
8. [Trang](#8-trang)
9. [Phản hồi khách hàng](#9-phản-hồi-khách-hàng)
10. [Tin nhắn liên hệ](#10-tin-nhắn-liên-hệ)
11. [Nội dung website](#11-nội-dung-website)
12. [Menu](#12-menu)
13. [Thanh toán & cài đặt](#13-thanh-toán--cài-đặt)
14. [Tài khoản của tôi](#14-tài-khoản-của-tôi)
15. [Mẹo chung](#15-mẹo-chung)

---

## 1. Tổng quan

Trang đầu tiên sau khi đăng nhập:

- **Doanh thu tháng này:** tổng tiền các đơn đã xác nhận, đang giao, đã giao trong tháng (không tính đơn chờ và đơn hủy).
- **Đơn chờ xác nhận:** đơn mới khách vừa đặt. Bấm **Xác nhận** ngay tại đây sau khi đã gọi cho khách.
- **Tin nhắn liên hệ mới:** khách gửi từ form Liên hệ, có nút Gọi / Zalo.
- **Làm nhanh:** thêm sản phẩm, viết bài, sửa trang chủ, tài khoản nhận tiền.

Số màu vàng cạnh mục **Đơn hàng** và **Tin nhắn liên hệ** trên menu là số việc chưa xử lý.

---

## 2. Đơn hàng

### Quy trình xử lý một đơn

| Bước | Trạng thái | Bạn làm gì |
|---|---|---|
| 1 | **Chờ xác nhận** | Khách vừa đặt. Gọi điện cho khách xác nhận đơn, báo phí giao hàng. |
| 2 | Bấm **Xác nhận đơn** → **Đã xác nhận** | Nhập **Phí giao hàng** (nếu có) → bấm **Lưu phí giao hàng**. Tổng tiền tự cộng thêm phí. |
| 3 | Bấm **Bắt đầu giao hàng** → **Đang giao hàng** | Hàng đang trên đường tới khách. |
| 4 | Bấm **Đã giao xong** → **Hoàn thành** | Đơn COD tự đánh dấu "đã nhận tiền". |

- Khách hủy hoặc không liên lạc được: bấm **Hủy đơn**. Muốn khôi phục: **Mở lại đơn**.
- **Chuyển khoản:** khách thấy mã QR sau khi đặt. Khi tiền về tài khoản, bấm **Đã nhận đủ tiền** (nội dung chuyển khoản thường là mã đơn, vd `DH12`).
- **Ghi chú:** ghi lại việc đã làm (vd "Khách hẹn giao thứ 7"). Khách không thấy ghi chú.
- **Trang đơn của khách:** xem đúng trang khách nhìn thấy (có mã QR).
- **Xóa đơn:** ở dòng đơn trong danh sách (biểu tượng thùng rác) hoặc cuối trang chi tiết. Đơn bị xóa không khôi phục được và không tính vào doanh thu.

### Tìm đơn
Gõ mã đơn (`DH12` hoặc `12`), tên, số điện thoại hoặc email vào ô tìm kiếm. Các tab phía trên lọc theo trạng thái.

---

## 3. Sản phẩm

### Thêm sản phẩm mới
**Sản phẩm → Thêm sản phẩm**, rồi điền:

1. **Tên sản phẩm.**
2. **Mô tả ngắn:** hiện ngay cạnh ảnh trên trang sản phẩm.
3. **Câu chuyện sản phẩm:** mô tả chi tiết (tab đầu tiên dưới ảnh).
4. **Thông số kỹ thuật:** mỗi dòng một thông số, dạng `Tên: giá trị`, ví dụ:
   ```
   Kích thước: 220 x 95 x 80 cm
   Chất liệu khung: Gỗ sồi
   Xuất xứ: Ý
   ```
5. **Giá & mẫu** – chọn **Kiểu sản phẩm**:
   - **Sản phẩm đơn (1 giá):** nhập Giá gốc, Giá khuyến mãi (để trống nếu không giảm), Kho (Còn hàng / Hết hàng).
   - **Có nhiều mẫu:** dùng khi sản phẩm có nhiều màu / chất liệu với giá hoặc ảnh khác nhau. Xem phần bên dưới.
6. Cột bên phải:
   - **Đang bán:** bật để hiện trên website; tắt để ẩn (vd sản phẩm chưa sẵn sàng).
   - **Ảnh chính** và **Ảnh khác:** bấm **Tải ảnh lên** / **+ Thêm ảnh** (chọn nhiều ảnh một lần được). Ảnh khác đầu tiên sẽ hiện khi khách di chuột vào sản phẩm. Nút ‹ để đổi thứ tự, × để bỏ ảnh.
   - **Danh mục:** tick các danh mục chứa sản phẩm (tick cả danh mục con, vd "Ghế sofa" và "Sofa Da").
   - **Màu sắc, chất liệu:** tick để sản phẩm hiện khi khách lọc theo màu / chất liệu.
7. Bấm **Tạo sản phẩm** / **Lưu sản phẩm** (thanh dưới cùng).

### Sản phẩm có nhiều mẫu (màu sắc / chất liệu)
1. **Kiểu sản phẩm** → chọn **Có nhiều mẫu**.
2. Bấm **Thêm mẫu** cho từng lựa chọn, ví dụ màu Nâu, màu Trắng.
3. Mỗi mẫu: chọn **Màu sắc** (và/hoặc **Chất liệu**), tải **Ảnh** riêng, nhập **Giá gốc**, **Giá khuyến mãi**, **Kho**.
   Chọn **— Bất kỳ —** nếu mẫu không phân biệt theo thuộc tính đó.
4. Trên website, khách bấm chọn màu (có ảnh nhỏ) → giá và ảnh lớn tự đổi theo mẫu.
5. Bấm biểu tượng thùng rác ở mẫu để bỏ mẫu đó.

> Màu mới chưa có trong danh sách? Thêm ở mục **Màu sắc, chất liệu** trước, rồi quay lại sản phẩm.

### Khung soạn nội dung
Các nút trên khung: **B** in đậm, *I* nghiêng, **H2 / H3** tiêu đề lớn / nhỏ, **¶** đoạn văn thường, **Danh sách**, **Link** (bôi đen chữ rồi bấm), **Ảnh** (chèn ảnh vào giữa bài), **</>** sửa mã HTML (dành cho người rành).

### Sửa, ẩn, xóa
- Bấm vào tên sản phẩm trong danh sách để sửa.
- Ẩn tạm: tắt **Đang bán**.
- Xóa hẳn: biểu tượng thùng rác. Đơn hàng cũ vẫn giữ tên sản phẩm.
- Lọc danh sách theo danh mục bằng ô chọn cạnh ô tìm kiếm.

---

## 4. Danh mục

- **Thêm danh mục:** nhập tên, chọn **Danh mục cha** nếu là danh mục con (vd "Sofa Da" thuộc "Ghế sofa").
- **Thứ tự:** số nhỏ đứng trước (trên trang chủ, bộ lọc, menu tự động).
- **Ảnh đại diện:** hiện ở vòng tròn khối "Danh mục" trang chủ và trong menu Sản phẩm.
  Trang chủ chỉ hiện danh mục **cấp 1 có ảnh**.
- **Banner:** tiêu đề + mô tả + ảnh hiện to ở đầu trang danh mục. Để trống tiêu đề = không có banner.
- **Mô tả:** hiện cuối trang danh mục, có nút "Xem thêm".
- **Xóa danh mục:** sản phẩm bên trong vẫn còn (chỉ bỏ khỏi danh mục này); danh mục con chuyển lên cấp trên.

---

## 5. Màu sắc, chất liệu

Danh sách giá trị dùng cho **bộ lọc** ở trang danh mục và cho khách **chọn mẫu** ở trang sản phẩm.

- **Thêm:** gõ tên (vd "Xám") → **Thêm**.
- **Đổi tên:** sửa ô chữ → bấm biểu tượng lưu.
- **Xóa:** thùng rác (sản phẩm đang dùng giá trị đó sẽ tự bỏ chọn).
- **Thêm thuộc tính mới** (vd "Kích thước"): ô cuối trang.
- **Đổi tên / xóa thuộc tính, ẩn khỏi bộ lọc:** bấm "Đổi tên / xóa thuộc tính" trong từng khung.

---

## 6. Khách hàng

Danh sách khách có tài khoản (đăng ký trên website hoặc tick "Tạo tài khoản" khi đặt hàng).

- **Tên đăng nhập** hiện ngay trong danh sách.
- **Khách quên mật khẩu:** bấm **Đổi mật khẩu** cạnh tên đăng nhập → gõ mật khẩu mới (ít nhất 6 ký tự) → **Lưu**.
  Màn hình báo lại tên đăng nhập và mật khẩu mới, bạn nhắn cho khách qua Zalo. Khách bị đăng xuất khỏi mọi thiết bị.
  (Mật khẩu cũ được mã hóa nên không ai xem được, kể cả quản trị.)
- Bấm tên khách để xem đơn hàng đã đặt, sửa họ tên / SĐT / email / địa chỉ.
- **Xóa khách hàng:** thùng rác. Đơn hàng cũ vẫn giữ lại.

---

## 7. Bài viết blog

- **Viết bài mới:** tiêu đề, nội dung (dùng **H2 / H3** cho các mục: website tự tạo mục lục "Nội dung" ở đầu bài), ảnh đại diện, chuyên mục.
- **Tóm tắt:** hiện ở thẻ bài viết; để trống thì tự lấy đầu bài.
- **Ngày đăng:** để trống = bây giờ.
- **Hiện trên website:** tắt để lưu nháp.
- **Chuyên mục blog** (cột phải của danh sách): thêm, đổi tên, xóa chuyên mục.
- Bài viết mới nhất tự hiện ở khối "Blog kiến thức" trang chủ.

---

## 8. Trang

Các trang chính sách, giới thiệu, liên hệ…

- **Kiểu trang:**
  - *Trang thường:* chính sách, hướng dẫn… (nội dung soạn ngay tại đây).
  - *Trang Giới thiệu* và *Trang Liên hệ:* bố cục đặc biệt, chữ và ảnh sửa ở **Nội dung website**.
- Trang mới muốn hiện trên menu: vào mục **Menu** thêm dòng `Tên trang | /duong-dan/`.
- Trang chủ, Cửa hàng, Giỏ hàng, Thanh toán, Tài khoản, Blog là trang có sẵn, không cần tạo.

---

## 9. Phản hồi khách hàng

Hiện ở khối "Khách hàng phản hồi" trang chủ và trang sản phẩm.
Thêm: tên khách, nghề nghiệp, lời phản hồi, ảnh (hiện tròn), thứ tự.

---

## 10. Tin nhắn liên hệ

Khách gửi từ form ở trang Liên hệ. Gọi / Zalo / Email cho khách bằng nút bên cạnh, xong bấm **Đã xử lý** để chuyển sang tab "Đã xử lý".

---

## 11. Nội dung website

Giống **Giao diện → Tùy biến** của WordPress. Chọn tab, sửa, bấm **Lưu nội dung**.

| Tab | Sửa gì |
|---|---|
| Thương hiệu | Tên website, logo (đầu trang / chân trang), biểu tượng tab trình duyệt, mô tả cho Google |
| Thông tin liên hệ & mạng xã hội | Điện thoại, hotline, Zalo, Messenger, email, địa chỉ, showroom, bản đồ, **email nhận thông báo đơn hàng mới**, Facebook… |
| Đầu trang & chân trang | Đoạn giới thiệu chân trang, tiêu đề các cột, dòng bản quyền, nút liên hệ nổi, chữ trong menu Sản phẩm |
| Trang chủ – Ảnh bìa & giới thiệu | Ảnh bìa lớn, dòng chữ trên ảnh, khối giới thiệu |
| Trang chủ – Danh mục & không gian | Bật/tắt khối, tiêu đề, chọn 3 danh mục "Không gian" (Phòng khách, Phòng ăn…) |
| Trang chủ – Các khối sản phẩm | 3 khối: tiêu đề, danh mục, số sản phẩm. Để trống tiêu đề = ẩn khối |
| Trang chủ – Thương hiệu, video, blog, báo chí | Logo thương hiệu, ảnh + link video YouTube, logo báo chí, ảnh Instagram… |
| Trang chi tiết sản phẩm | Khung ưu đãi, quyền lợi, chữ nút hỗ trợ (mỗi dòng một ý) |
| Trang Giới thiệu | Ảnh bìa, tiêu đề, các đoạn văn, 3 giá trị, 3 dịch vụ |
| Trang Liên hệ | Ảnh bìa, tiêu đề, lời giới thiệu, ảnh "Theo dõi chúng tôi" |

Bấm **Xem trang chủ** (góc trên) để mở website kiểm tra.

---

## 12. Menu

Mỗi ô là một menu: Menu chính (đầu trang) và 3 cột chân trang. Mỗi dòng là một mục:

```
Về chúng tôi | /gioi-thieu/
Sản Phẩm | /cua-hang/
- Ghế sofa | /danh-muc-san-pham/ghe-sofa/
-- Sofa Da | /danh-muc-san-pham/sofa-da/
Facebook | https://facebook.com/... | tab-moi
```

- `-` ở đầu dòng: menu con của dòng phía trên; `--`: cấp 3.
- `| tab-moi` ở cuối: mở link trong tab mới.
- Trong Menu chính, mục có menu con là **danh mục sản phẩm** tự thành bảng lớn có ảnh (như bản WordPress).
- Bấm **Danh sách link có sẵn** để chép link các trang, danh mục, chuyên mục.

---

## 13. Thanh toán & cài đặt

- **Thanh toán:**
  - **COD** (trả tiền khi nhận hàng): bật/tắt, tên và mô tả cho khách.
  - **Chuyển khoản:** bật/tắt, hướng dẫn, tối đa 3 tài khoản ngân hàng (ngân hàng, số tài khoản, chủ tài khoản viết hoa không dấu).
    Mã QR tự tạo cho các ngân hàng phổ biến (Vietcombank, VietinBank, BIDV, Agribank, Techcombank, MB, ACB, VPBank, TPBank, Sacombank…).
- **Tài khoản quản trị:** thêm nhân viên.
  *Nhân viên* xử lý đơn, sản phẩm, bài viết… nhưng không vào được các mục Cài đặt. *Quản trị viên* vào được tất cả.
- **Email đã gửi:** xem các email website đã gửi (hoặc chưa gửi được vì chưa cài SMTP).

---

## 14. Tài khoản của tôi

Đổi tên hiển thị, tên đăng nhập, email, mật khẩu của chính bạn. Phải nhập **mật khẩu hiện tại** để lưu.
Đổi mật khẩu xong, các thiết bị khác đang đăng nhập tài khoản này bị đăng xuất.

Quên mật khẩu admin: ở trang đăng nhập bấm **Quên mật khẩu?** (cần cài gửi email), hoặc nhờ một quản trị viên khác đặt lại.

---

## 15. Mẹo chung

- Thanh **Lưu** ở dưới cùng báo "Có thay đổi chưa lưu" khi bạn sửa mà chưa bấm lưu; rời trang sẽ được hỏi lại.
- Mọi nút **Xóa** đều hỏi xác nhận trước. Đã xóa thì không khôi phục được.
- Bấm vào cả dòng trong bảng (đơn hàng, sản phẩm, khách hàng…) để mở chi tiết.
- **Xem website** (cuối menu trái) mở website trong tab mới để kiểm tra.
- Khách đăng nhập website và bạn đăng nhập quản trị trên cùng trình duyệt không ảnh hưởng nhau.
