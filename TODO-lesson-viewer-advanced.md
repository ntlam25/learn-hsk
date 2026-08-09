# TODO: tính năng nâng cao còn thiếu so với file tham khảo

Đối chiếu `Giáo trình Hán ngữ Bài 1–15.html` với trang xem bài học (`client/src/pages/LessonViewPage.jsx` và các component liên quan), các tính năng dưới đây **đã bị hoãn** (không làm trong đợt nâng cấp form soạn bài + upload file) vì khối lượng lớn/đặc thù. Ghi lại ở đây để không quên, làm sau nếu cần.

## 1. Bút thuận gom nhóm cho cụm từ / tên quốc gia

- Class tham khảo: `.stroke-toggle`, `.inline-stroke-panel`, `.mini-writer-wrap`, `.mini-writer`, `.mini-label`.
- Hiện tại `TianziBox.jsx` chỉ chạy HanziWriter cho **1 ký tự** trong ô tianzige lớn. File tham khảo còn có nút "✍ Bút thuận" thu gọn, bấm vào mở ra 1 hàng ô nhỏ (62×62px) chạy bút thuận cho **từng ký tự của cả cụm từ/tên quốc gia** (VD: mỗi từ trong `wordlist`, mỗi hàng trong bảng quốc gia).
- Cần: component `InlineStrokeToggle` mới (nhận 1 chuỗi nhiều ký tự, tách từng ký tự, lazy-init HanziWriter khi mở), gắn vào `VocabCard.jsx` (wordlist/related) và `CountryTable.jsx`.

## 2. Quiz chọn thanh điệu

- Class tham khảo: `.tone-quiz`, `.tone-question`, `.tone-word`, `.tone-options`, `.tone-result`.
- Là 1 dạng luyện tập client-side, không chấm điểm/không lưu server (khác với `exerciseItems` hiện có — quiz đó có chấm điểm qua API).
- Cần: schema mới (VD: `phoneticsNotes[].toneQuiz: [{word, options:[{tone,syllable}], correctTone}]`), component quiz mới, UI chọn trong `PhoneticsNotes.jsx`.

## 3. Banner giới thiệu ngữ âm cỡ lớn + thẻ quy tắc biến điệu có màu

- Class tham khảo: `.phonetics-hero`, `.big-one` (chữ cỡ lớn mở đầu tab Ngữ âm), `.rule-grid`/`.rule-card`/`.rule-form`, `.tone-y1`/`.tone-y2`/`.tone-y4` (tô màu theo thanh điệu trong ví dụ).
- Cần: mở rộng schema `phoneticsNotes` (hiện chỉ `{title, content}`) thêm 1 loại nội dung mới "quy tắc biến điệu" có cấu trúc riêng, và component hiển thị tương ứng.

## 4. Banner trạng thái tải bút thuận (CDN)

- Class tham khảo: `.stroke-service-state` (`.ok`/`.warn`) — báo "✓ Bút thuận đã sẵn sàng" hoặc cảnh báo khi script HanziWriter tải lỗi.
- Hiện `TianziBox.jsx` chỉ âm thầm set `failed` cục bộ mỗi ô, không có banner tổng hiển thị cho người dùng.

## 5. Thanh tiến độ "đã thuộc N/M từ"

- Class tham khảo: `.progress-wrap`, `.progress-bar`, `.progress-bar-fill`.
- Hiện mỗi `VocabCard.jsx` tự quản trạng thái "đã học" (`done`) cục bộ bằng `useState`, không nâng lên component cha, không lưu persist (mất khi reload).
- Cần: nâng state `done` lên `LessonViewPage.jsx` (hoặc dùng localStorage/API riêng), tính tổng để hiển thị thanh tiến độ phía trên `.vocab-grid`.

## 6. Avatar hội thoại dạng dài + highlight từ khoá trong câu

- Class tham khảo: `.dlg-avatar.long-role` (avatar dạng pill tự giãn cho vai có tên dài, thay vì hình tròn cố định), `.dlg-text .focus`/`.dlg-pinyin .focus` (tô đậm 1 cụm từ trọng tâm trong câu thoại).
- `DialogueBlock.jsx` hiện luôn vẽ avatar tròn cố định, không hỗ trợ `long-role`; `line.text`/`line.py` render dạng plain string, không hỗ trợ đánh dấu 1 đoạn con để highlight.
- Cần: xác định ngưỡng độ dài `role` để tự chuyển sang pill, và một cú pháp đơn giản (VD: `**...**` hoặc mảng segment) cho phần focus trong `line.text`/`line.py`.
