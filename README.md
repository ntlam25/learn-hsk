# Hán Ngữ LMS

Nền tảng quản lý + học tập tiếng Trung: nhiều khoá học chia theo trình độ HSK, tài
khoản học viên/giáo viên/admin, lớp học + ghi danh, bài học đầy đủ tab Từ mới/Bài
khóa/Ngữ âm/Ngữ pháp/Luyện tập kèm file nghe theo từng khu vực và ảnh/PDF trang sách
gốc, quiz chấm điểm + flashcard ôn từ vựng, báo cáo tiến độ lớp, và mood giao diện do
admin cấu hình.

```
hanzi-course/
  server/   Express REST API — dữ liệu & auth qua Supabase (Postgres), file qua Supabase Storage
  client/   React SPA (Vite) — trang học viên + trang quản trị
  sql/      schema.sql — chạy 1 lần trong Supabase SQL Editor
  render.yaml  Blueprint deploy backend + frontend lên Render (tuỳ chọn)
```

## 1. Database + Storage — Supabase

1. Vào https://supabase.com/dashboard → **New project** (gói Free 500MB database +
   1GB storage là đủ dùng).
2. Vào **SQL Editor** → New query → dán toàn bộ nội dung [`sql/schema.sql`](./sql/schema.sql)
   → **Run**. Lệnh này tạo các bảng `users`, `courses`, `lessons`, `lesson_audio_tracks`,
   `lesson_pages`, `exercise_items`, `flashcard_reviews`, `submissions`, `classes`,
   `class_lessons`, `enrollments`, `lesson_progress`, `site_settings`, và bật RLS (khoá truy cập trực
   tiếp — chỉ backend dùng service key mới đọc/ghi được).
3. Vào **Storage** → **New bucket** → tên `lesson-media` → bật **Public bucket** → Create.
4. Vào **Project Settings → API**, lấy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (không phải `anon` key) → `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ `service_role key` bỏ qua mọi RLS — **chỉ** đặt trong biến môi trường backend,
   không đưa vào code frontend hay commit lên git công khai.

## 2. Chạy thử ở máy local

```bash
# Backend
cd server
cp .env.example .env      # điền SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run seed                # tạo tài khoản admin + khoá "Hán ngữ cơ sở" + seed Bài 1–15
npm run dev                  # http://localhost:5000

# Frontend (terminal khác)
cd client
cp .env.example .env        # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                  # http://localhost:5173
```

Tài khoản admin mặc định sau khi seed (đổi `SEED_ADMIN_PASSWORD` trong `.env` trước
khi seed nếu muốn mật khẩu khác):
- email: `admin@hanzi-course.local` (đổi bằng `SEED_ADMIN_EMAIL`)
- password: `ChangeMe123!`

### Nội dung Bài 1–15 lấy từ giáo trình HTML

Trang xem bài học (`/lessons/:id`) hiển thị y hệt file `Giáo trình Hán ngữ Bài 1–15.html`
(CSS gốc nằm ở [`client/src/styles/book.css`](./client/src/styles/book.css)). Nội dung chữ của 15 bài
trong `server/src/seed/lesson{1..15}.json` được sinh tự động từ file HTML đó:

```bash
pip install beautifulsoup4
python server/scripts/import_book.py "Giáo trình Hán ngữ Bài 1–15.html"
cd server && npm run seed -- --update   # ghi đè nội dung chữ của các bài đã có
```

**File nghe, ảnh trang sách và PDF không đi qua seed** — giáo viên tải lên trong trình soạn bài
(tab Luyện tập có nút "Tải nhiều ảnh trang cùng lúc", số trang lấy theo số trong tên file). Bài tạo
mới từ seed có sẵn các ô trống (tên file nghe, mã file, số trang) để điền file vào; ô chưa có file
không hiển thị với học viên. `--update` không đụng tới file nghe / ảnh trang đã tải.

Nếu DB được tạo từ `schema.sql` cũ, chạy [`sql/005_add_audio_size.sql`](./sql/005_add_audio_size.sql)
một lần (lưu dung lượng file nghe để hiển thị "0.5 MB" như giáo trình), và
[`sql/006_add_known_vocab.sql`](./sql/006_add_known_vocab.sql) (lưu các từ học viên đã đánh dấu "đã thuộc"),
rồi [`sql/007_class_flow.sql`](./sql/007_class_flow.sql) (mã lớp, ngày bắt đầu/kết thúc, lịch mở bài theo lớp,
thời điểm hoàn thành bài; các lớp đang có được mở sẵn mọi bài hiện tại để không bị gián đoạn).

### Bước tiếp theo sau khi seed

1. Đăng nhập admin ở `/login`.
2. (Tuỳ chọn) Vào **Cài đặt** đổi mood giao diện.
3. Vào **Quản lý khoá học** để tạo thêm khoá học theo HSK2–HSK6, hoặc **Quản trị
   bài học** để soạn thêm bài trong khoá "Hán ngữ cơ sở" đã seed sẵn.
4. Vào **Quản lý lớp học** → **+ Tạo lớp**: chọn khoá học, giáo viên phụ trách (admin),
   ngày bắt đầu/kết thúc. Mở trang lớp:
   - tab **Bài học**: mở bài cho lớp (mở ngay, hẹn ngày giờ, hoặc "Mở đến bài N") —
     lớp mới chưa mở bài nào;
   - tab **Học viên**: thêm học viên theo 3 cách —
     (a) gửi **mã lớp / link `/join/MÃ`** ở tab Tổng quan để học viên tự vào,
     (b) **Thêm hàng loạt** tên đăng nhập/email của học viên đã có tài khoản,
     (c) **Tạo tài khoản** (username, họ tên, email tuỳ chọn) — hệ thống sinh mật khẩu tạm,
     chỉ hiện một lần để sao chép gửi học viên;
   - tab **Báo cáo**: bảng học viên × bài (hoàn thành / % từ đã thuộc / quiz), xuất CSV.
5. Học viên vào **Khoá học của tôi** thấy từng lớp, tiến độ và nút **Học tiếp**. Trong khoá,
   bài chưa mở hiện 🔒 (kèm ngày mở nếu có). Bài được tính **hoàn thành** khi học viên bấm
   "Hoàn thành bài" cuối bài, hoặc tự động khi thuộc hết từ mới và làm đúng hết quiz.
   Lớp quá ngày kết thúc / đã lưu trữ: học viên chỉ xem lại, không nộp bài.
6. Riêng bài nào bật **"Cho xem trước"** trong trang soạn bài thì ai cũng xem được
   ngay từ trang chủ, không cần đăng nhập/vào lớp.

## 3. Deploy lên production (miễn phí)

| Phần | Nơi deploy | Ghi chú |
|---|---|---|
| Database + Storage | **Supabase** | đã tạo ở bước 1 |
| Backend (Express API) | **Render** (Web Service, free) hoặc Railway | biến môi trường như `.env.example` |
| Frontend (React build) | **Vercel** / **Netlify** / Render Static Site | biến môi trường `VITE_API_URL` |

### Cách nhanh nhất: Render Blueprint (deploy cả 2 cùng lúc)

1. Push code này lên 1 repo GitHub.
2. Vào https://dashboard.render.com/blueprints → **New Blueprint Instance** →
   chọn repo → Render tự đọc [`render.yaml`](./render.yaml) ở gốc repo và tạo sẵn
   2 service: `hanzi-course-api` (backend) và `hanzi-course-client` (frontend static).
3. Điền các biến môi trường được đánh dấu `sync: false` khi Render hỏi:
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (service api) và `VITE_API_URL`
   (service client — điền **sau khi** đã biết URL của `hanzi-course-api`, dạng
   `https://hanzi-course-api.onrender.com/api`).
4. Sau khi `hanzi-course-api` deploy xong, vào **Shell** của service đó chạy
   `npm run seed` một lần.
5. Vào lại `hanzi-course-client`, cập nhật env `VITE_API_URL` cho đúng rồi **Manual
   Deploy** lại (biến môi trường `VITE_*` chỉ được nhúng lúc build).
6. Cập nhật `CORS_ORIGIN` ở service backend bằng URL thật của frontend, redeploy backend.

### Cách thủ công (Vercel cho frontend, Render cho backend)

**Backend → Render:**
1. New → Web Service → chọn repo, Root Directory: `server`.
2. Build Command: `npm install` — Start Command: `npm start`.
3. Thêm biến môi trường: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_BUCKET=lesson-media`, `JWT_SECRET` (chuỗi ngẫu nhiên dài),
   `JWT_EXPIRES_IN=7d`, `CORS_ORIGIN=<url frontend sau khi deploy>`.
4. Deploy, sau đó vào Shell chạy `npm run seed`.

**Frontend → Vercel:**
1. Import repo trên vercel.com, Root Directory: `client`.
2. Framework Preset: Vite. Build Command mặc định `npm run build`, Output
   Directory `dist`.
3. Thêm biến môi trường `VITE_API_URL=https://<backend-render-url>/api`.
4. File `client/vercel.json` đã có sẵn rewrite rule để React Router hoạt động
   đúng khi tải trực tiếp URL con hoặc F5 trang (Netlify dùng `client/public/_redirects`).

## 4. API upload file (Supabase Storage)

Yêu cầu header `Authorization: Bearer <token>` (đăng nhập admin/giáo viên).

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/admin/uploads` | Upload 1 file. Body `multipart/form-data`: `file` (bắt buộc), `folder` (tuỳ chọn: `images` \| `audio` \| `book-pages`, mặc định `images`). Trả `{ path, url, originalName, size, mimeType }`. |
| `GET` | `/api/admin/uploads?folder=images` | Liệt kê file đã tải lên trong 1 thư mục. |
| `DELETE` | `/api/admin/uploads` | Body JSON `{ "path": "images/xxx.png" }` — xoá file khỏi Storage. |

Giới hạn dung lượng mỗi file: biến `MAX_UPLOAD_MB` (mặc định 15MB). Định dạng được
chấp nhận: ảnh (`png/jpeg/webp/gif/svg`) và audio (`mp3/wav/ogg/m4a`).

Trên trang soạn bài (`/admin/lessons/:id/edit`), mục **"Ảnh & Audio"** cho phép tải
file lên rồi copy URL, dán vào các ô JSON `audioTracks` (chọn đúng `category`:
`vocab`/`text`/`phonetics`/`practice` để hiện đúng tab) hoặc `pages` (ảnh trang sách
gốc, dùng thư mục `book-pages`).

## 5. Tổng quan chức năng

- Tài khoản 3 vai trò: `admin`, `teacher`, `student` (JWT tự quản, không dùng
  Supabase Auth). Học viên phải thuộc một lớp của khoá (vào bằng mã lớp, hoặc được giáo viên
  thêm / tạo tài khoản) và bài phải được lớp đó mở mới xem được — trừ bài đánh dấu "xem trước".
- Nhiều khoá học chia theo HSK1–HSK6 (hoặc không gắn HSK), mỗi khoá nhiều bài học.
- Mỗi bài học có tab động: Từ mới / Bài khóa / (Ngữ âm nếu có) / (Ngữ pháp nếu có) /
  Luyện tập — mỗi tab có thể gắn file nghe riêng và bài có thể gắn ảnh/PDF trang
  sách gốc xem dạng lightbox phóng to.
- Bài tập có chấm điểm thật (`exercise_items` kind `quiz`, so đáp án tự động, lưu
  `submissions`) và flashcard ôn từ vựng (kind `flashcard`, học viên tự đánh giá
  thuộc/chưa thuộc, lưu `flashcard_reviews`, ưu tiên hiện lại thẻ chưa thuộc).
- Giáo viên quản lý lớp mình phụ trách: mã mời, học viên, lịch mở bài, báo cáo tiến độ
  theo từng bài (trạng thái, % từ đã thuộc, quiz, flashcard, lần hoạt động gần nhất).
- Admin cấu hình "mood" giao diện toàn hệ thống (vui/buồn/tập trung/thư giãn) —
  chỉ đổi màu sắc/hiệu ứng, giữ nguyên bố cục.
