# Hướng dẫn chép và chạy website Nội Thất IRIS (bản Node.js) trên máy Windows

Cập nhật: 21/11/2026

Website chạy ngay trên máy tính để xem và thử, chưa cần hosting hay server.

| | Địa chỉ | Tài khoản thử |
|---|---|---|
| Website | http://localhost:3000 | Khách hàng: `khachhang` / `khachhang123` |
| Quản trị | http://localhost:3000/quan-tri/ | Quản trị: `admin` / `admin` |

> Đây là tài khoản thử, chỉ dùng trên máy. Đổi mật khẩu admin trước khi đưa website lên mạng.

---

## 1. Lấy source ở đâu

Chọn **một** trong hai cách:

- **Cách A – File zip (dễ nhất):** chép file `noithat-node-source.zip` (trong thư mục `Documents/VANHIEP` trên máy Mac) sang máy Windows bằng USB, Google Drive hoặc Zalo.
  File zip đã có sẵn dữ liệu (sản phẩm, danh mục, bài viết, ảnh, nội dung trang chủ).
- **Cách B – Tải từ GitHub:** vào https://github.com/honganhnguyen222023/noithat/tree/node-nextjs → bấm nút xanh **Code** → **Download ZIP**.
  Bản này không có file dữ liệu `noithat.db`; lần chạy đầu website tự tạo dữ liệu từ bản WordPress (giống lúc mới chuyển sang).

---

## 2. Chạy trên Windows (Windows 10 / 11)

### Bước 1 – Cài Node.js (làm 1 lần)
1. Vào https://nodejs.org, tải bản **LTS** (Node.js 22), chọn **Windows Installer (.msi)**.
2. Mở file vừa tải, bấm **Next** liên tục rồi **Install**, giữ nguyên các lựa chọn mặc định.
3. Cài xong thì **khởi động lại máy** để Windows nhận Node.js.

### Bước 2 – Giải nén
1. Chuột phải vào file zip → **Extract All…** (Giải nén tất cả).
2. Nên giải nén vào ổ C cho ngắn gọn, ví dụ `C:\noithat-node`.
   Tránh thư mục có tên quá dài hoặc nằm trong OneDrive.
3. Mở thư mục vừa giải nén, kiểm tra thấy file `Chay-website.bat` (nếu bị lồng 2 lớp thư mục thì mở thêm 1 lớp).

### Bước 3 – Tránh phần mềm diệt virus xóa nhầm file (làm 1 lần)
1. Mở **Windows Security** → **Virus & threat protection**.
2. **Manage settings** → kéo xuống **Exclusions** → **Add or remove exclusions**.
3. **Add an exclusion** → **Folder** → chọn thư mục `C:\noithat-node`.

### Bước 4 – Chạy website
1. Bấm đúp file **`Chay-website.bat`**.
2. **Lần đầu:** máy cần có Internet và đợi khoảng 2–5 phút để cài thư viện, tạo dữ liệu. Những lần sau chỉ mất vài giây.
3. Nếu Windows hỏi "Windows protected your PC": bấm **More info** → **Run anyway**.
4. Nếu Windows hỏi tường lửa (Firewall) cho Node.js: bấm **Allow** (Cho phép).
5. Trình duyệt tự mở http://localhost:3000. Nếu chưa thấy, tự gõ địa chỉ đó vào trình duyệt.

**Tắt website:** đóng cửa sổ màu đen. **Chạy lại:** bấm đúp `Chay-website.bat`.

---

## 3. Cập nhật bản mới (khi có sửa code)

1. Tắt website (đóng cửa sổ màu đen).
2. **Giữ lại dữ liệu đang dùng:** chép riêng file `prisma\noithat.db` và thư mục `public\uploads\media` (ảnh tải lên trong quản trị) ra chỗ khác.
3. Xóa thư mục cũ, giải nén bản mới vào đúng chỗ cũ.
4. Chép 2 thứ ở bước 2 trở lại đúng vị trí cũ.
5. Bấm đúp `Chay-website.bat` (file tự cập nhật cấu trúc dữ liệu, giữ nguyên dữ liệu).

---

## 4. Lỗi thường gặp

| Lỗi | Cách sửa |
|---|---|
| "Chưa có Node.js" hoặc `'node' is not recognized` | Chưa cài Node.js hoặc cài xong chưa khởi động lại máy. Làm lại Bước 1. |
| `'prisma' is not recognized` hoặc `'next' is not recognized` | Lần cài thư viện trước bị dở (mất mạng, tắt giữa chừng, diệt virus xóa file). Xóa thư mục `node_modules` rồi bấm đúp lại `Chay-website.bat`. |
| Lỗi khi `npm install` | Kiểm tra Internet rồi chạy lại. Vẫn lỗi: xóa `node_modules` rồi chạy lại. |
| `Port 3000 is in use` | Đang có 1 website khác chạy (vd web KhoaHoc). Đóng cửa sổ đó hoặc khởi động lại máy. |
| `EPERM`, `operation not permitted`, file biến mất | Diệt virus đang chặn. Làm Bước 3 rồi giải nén lại. |
| Muốn về dữ liệu ban đầu | Tắt website, xóa file `prisma\noithat.db` rồi chạy lại. Website tự tạo lại dữ liệu từ bản WordPress (mọi thay đổi đã làm sẽ mất). |

---

## 5. Cấu hình thêm (không bắt buộc)

Mở file `.env` trong thư mục website bằng Notepad (file được tạo ở lần chạy đầu, chép từ `.env.example`).

- **Gửi email thật** (đơn hàng mới, quên mật khẩu, tin nhắn liên hệ): điền `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`.
  Gmail: `SMTP_HOST="smtp.gmail.com"`, `SMTP_PORT="587"`, `SMTP_USER` = địa chỉ Gmail, `SMTP_PASS` = **mật khẩu ứng dụng 16 chữ**
  (tạo tại https://myaccount.google.com/apppasswords, cần bật Xác minh 2 bước).
  Chưa điền: email không gửi đi mà được lưu ở **Quản trị → Thanh toán & cài đặt → Email đã gửi**.
- Sửa `.env` xong: tắt website rồi chạy lại.

> Lưu ý: khi chạy trên máy, link trong email có dạng `http://localhost:3000/...` nên khách mở trên máy khác sẽ không vào được.
> Email chỉ thật sự dùng được khi website đã đưa lên mạng (có tên miền, sửa `SITE_URL` trong `.env`).

---

## 6. Lưu ý

- Dữ liệu (sản phẩm, đơn hàng, khách hàng…) nằm trong file `prisma\noithat.db` của **từng máy**, không tự đồng bộ giữa các máy.
- Muốn đưa lên mạng cho khách dùng thật: cần VPS hoặc dịch vụ chạy được Node.js (hosting WordPress thông thường không chạy được). Xem phần "Đưa lên server" trong `README.md`.
- Cách dùng trang quản trị: xem file **`HUONG-DAN-QUAN-TRI.md`**.
