import Select from '../../ui/Select';
import Checkbox from '../../ui/Checkbox';
import FileUploadField from '../../ui/FileUploadField';
import Button from '../../ui/Button';

// Header của trình soạn bài học: tái dùng đúng khối .hero của trang xem bài học
// (con dấu / tiêu đề Hán / phụ đề / nhãn) nhưng thay chữ tĩnh bằng input, cộng
// thêm hàng cấu hình gọn (khoá học, số bài, PDF gốc, xuất bản/xem trước, lưu).
export default function EditableHero({ lesson, courses, onChange, onSubmit, saving }) {
  function set(field, value) {
    onChange(field, value);
  }

  return (
    <header className="hero hero-edit">
      <input className="seal seal-input" value={lesson.seal} onChange={(e) => set('seal', e.target.value)} placeholder="印" />
      <input
        className="hero-h1-input"
        value={lesson.titleZh}
        onChange={(e) => set('titleZh', e.target.value)}
        placeholder="第X课"
      />
      <input
        className="hero-subtitle-input"
        value={lesson.titleVi}
        onChange={(e) => set('titleVi', e.target.value)}
        placeholder="Bài X · Tiêu đề"
        required
      />
      <input className="hero-tag-input" value={lesson.tag} onChange={(e) => set('tag', e.target.value)} placeholder="Nhãn (tag)" />

      <div className="hero-settings-row">
        <Select
          value={lesson.courseId}
          onChange={(v) => set('courseId', v)}
          placeholder="-- Chọn khoá học --"
          options={courses.map((c) => ({ value: c.id, label: `${c.title}${c.hskLevel ? ` (${c.hskLevel})` : ''}` }))}
        />
        <input
          type="number"
          className="hero-lesson-number-input"
          placeholder="Số bài"
          required
          value={lesson.lessonNumber}
          onChange={(e) => set('lessonNumber', e.target.value)}
        />
        <FileUploadField
          value={lesson.sourcePdfUrl}
          onChange={(v) => set('sourcePdfUrl', v)}
          folder="documents"
          accept="application/pdf"
          previewKind="none"
          label="PDF trang sách gốc"
        />
        <Checkbox checked={lesson.published} onChange={(e) => set('published', e.target.checked)} label="Xuất bản" />
        <Checkbox checked={lesson.isPreview} onChange={(e) => set('isPreview', e.target.checked)} label="Cho xem trước" />
        <Button type="button" onClick={onSubmit} disabled={saving}>
          {saving ? 'Đang lưu…' : 'Lưu bài học'}
        </Button>
      </div>
    </header>
  );
}
