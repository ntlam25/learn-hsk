import { useEffect, useRef, useState } from 'react';
import api from '../../../api/client';
import { useToast } from '../../../context/ToastContext';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import MultiSelect from '../../ui/MultiSelect';

const SAMPLE_URL = '/samples/lesson-import-sample.json';

const MODE_OPTIONS = [
  { value: 'skip', title: 'Bỏ qua', desc: 'Giữ nguyên bài đã có, chỉ thêm bài mới.' },
  {
    value: 'overwrite',
    title: 'Ghi đè',
    desc: 'Cập nhật các trường có trong file. File nghe / ảnh trang đã tải lên được giữ nếu ô trong file để trống URL.',
  },
];

const ACTION_LABEL = {
  create: { text: 'Tạo mới', cls: 'active' },
  update: { text: 'Ghi đè', cls: 'upcoming' },
  skip: { text: 'Bỏ qua', cls: 'archived' },
  error: { text: 'Lỗi', cls: 'error' },
};

// Import nhiều bài học từ file JSON: chọn file → server kiểm tra thử (dryRun) → xem trước → nhập.
// Truyền `courses` để hiện ô chọn khoá đích (chọn nhiều; không chọn = bài độc lập), mặc định `defaultCourseId`;
// không truyền `courses` thì import thẳng vào `courseId` cố định (trang chi tiết khoá học).
export default function ImportLessonsModal({ open, courseId: fixedCourseId, courses, defaultCourseId = '', onClose, onImported }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [data, setData] = useState(null);
  const [mode, setMode] = useState('skip');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [courseIds, setCourseIds] = useState([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial = fixedCourseId || defaultCourseId;
    setCourseIds(initial ? [initial] : []);
    setFileName('');
    setData(null);
    setReport(null);
    setError('');
  }, [open]);

  async function run(json, nextMode, dryRun, targetIds = courseIds) {
    setBusy(true);
    setError('');
    try {
      const res = await api.post('/admin/lessons/import', { courseIds: targetIds, mode: nextMode, dryRun, data: json });
      setReport(res.data);
      return res.data;
    } catch (err) {
      if (dryRun) setReport(null); // lỗi khi nhập thật thì giữ bảng kết quả để còn thử lại
      setError(err.response?.data?.message || 'Không kiểm tra được file.');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function loadFile(file) {
    if (!file) return;
    setFileName(file.name);
    setReport(null);
    let json;
    try {
      json = JSON.parse(await file.text());
    } catch (err) {
      setData(null);
      setError(`File không phải JSON hợp lệ: ${err.message}`);
      return;
    }
    setData(json);
    run(json, mode, true);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    loadFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (!busy) loadFile(e.dataTransfer.files?.[0]);
  }

  function changeCourse(next) {
    setCourseIds(next);
    if (data) run(data, mode, true, next);
  }

  function changeMode(next) {
    setMode(next);
    if (data) run(data, next, true);
  }

  function notify(summary) {
    const { create, update, attach = 0, error: failed } = summary;
    if (create + update + attach > 0) {
      const parts = [`${create} bài mới`, update && `ghi đè ${update} bài`, attach && `gắn thêm ${attach} bài có sẵn vào khoá`];
      toast.success(`Đã nhập ${parts.filter(Boolean).join(', ')}.`);
      onImported();
    }
    if (failed) toast.error(`${failed} bài lỗi — sửa xong bấm "Thử lại", hoặc chọn file đã sửa.`);
    return !failed;
  }

  async function handleImport() {
    const result = await run(data, mode, false);
    if (result && notify(result.summary)) onClose();
  }

  // Chỉ gửi lại các bài lỗi (bài đã nhập thành công giữ nguyên kết quả trong bảng)
  async function handleRetry() {
    const failed = report.results.filter((r) => r.action === 'error').map((r) => r.index);
    const all = Array.isArray(data) ? data : Array.isArray(data?.lessons) ? data.lessons : [data];
    const prev = report;
    const result = await run(failed.map((i) => all[i]), mode, false);
    if (!result) return;
    const retried = new Map(result.results.map((r, i) => [failed[i], { ...r, index: failed[i] }]));
    const results = prev.results.map((r) => retried.get(r.index) || r);
    const summary = { create: 0, update: 0, skip: 0, error: 0 };
    results.forEach((r) => summary[r.action]++);
    setReport({ dryRun: false, summary, results });
    if (notify(result.summary)) toast.success('Đã nhập xong toàn bộ.');
  }

  const writable = report ? report.summary.create + report.summary.update + (report.summary.attach || 0) : 0;
  const done = report && !report.dryRun;
  const failedCount = done ? report.summary.error : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="wide"
      title="Import bài học từ JSON"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {done ? 'Đóng' : 'Huỷ'}
          </Button>
          {!done && (
            <Button onClick={handleImport} disabled={busy || !report || writable === 0}>
              {busy ? 'Đang xử lý…' : `Nhập ${writable} bài`}
            </Button>
          )}
          {failedCount > 0 && (
            <Button onClick={handleRetry} disabled={busy}>
              {busy ? 'Đang xử lý…' : `Thử lại ${failedCount} bài lỗi`}
            </Button>
          )}
        </>
      }
    >
      <div className="imp">
        {courses && (
          <section className="imp-section">
            <div className="imp-label">Thêm vào khoá</div>
            <MultiSelect
              className="imp-select"
              value={courseIds}
              onChange={changeCourse}
              placeholder="Bài độc lập (không chọn khoá nào)"
              options={courses.map((c) => ({ value: c.id, label: c.title }))}
              disabled={busy}
            />
            <span className="imp-hint">
              {courseIds.length
                ? `Mỗi bài được dùng chung ở ${courseIds.length} khoá đã chọn.`
                : 'Không chọn khoá nào → bài độc lập, gắn vào khoá sau ở trình soạn bài hoặc trang khoá học.'}
            </span>
          </section>
        )}

        <section className="imp-section">
          <div className="imp-label-row">
            <span className="imp-label">File dữ liệu</span>
            <a href={SAMPLE_URL} download="lesson-import-sample.json" className="imp-sample" title="File mẫu có ghi chú cho từng trường">
              ⬇ Tải file mẫu
            </a>
          </div>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={handleFile} />
          <div
            className={'imp-drop' + (dragging ? ' dragging' : '') + (fileName ? ' has-file' : '')}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <div className="imp-drop-icon" aria-hidden="true">
              {fileName ? '✓' : '{ }'}
            </div>
            <div className="imp-drop-text">
              {fileName ? (
                <strong className="imp-file">{fileName}</strong>
              ) : (
                <strong>Kéo thả file .json vào đây</strong>
              )}
              <span>{fileName ? (busy ? 'Đang kiểm tra…' : 'Đã đọc file — xem kết quả kiểm tra bên dưới.') : 'hoặc bấm nút để chọn từ máy'}</span>
            </div>
            <Button variant={fileName ? 'secondary' : 'primary'} onClick={() => fileRef.current?.click()} disabled={busy}>
              {fileName ? 'Chọn file khác' : 'Chọn file'}
            </Button>
          </div>
        </section>

        <section className="imp-section">
          <div className="imp-label">Khi số bài đã tồn tại</div>
          <div className="imp-modes" role="radiogroup">
            {MODE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={mode === o.value}
                className={'imp-mode' + (mode === o.value ? ' active' : '')}
                onClick={() => changeMode(o.value)}
                disabled={busy}
              >
                <span className="imp-mode-dot" />
                <span>
                  <strong>{o.title}</strong>
                  <small>{o.desc}</small>
                </span>
              </button>
            ))}
          </div>
        </section>

        {error && <div className="alert-error">{error}</div>}

        {report && (
          <>
            <div className="imp-summary">
              <span className="imp-label">{done ? 'Kết quả' : 'Xem trước'}</span>
              {['create', 'update', 'skip', 'error'].map((k) => (
                <span key={k} className={'class-status ' + ACTION_LABEL[k].cls}>
                  {report.summary[k]} {ACTION_LABEL[k].text.toLowerCase()}
                </span>
              ))}
            </div>
            <div className="imp-table-wrap">
            <table className="admin-table lesson-import-table">
              <thead>
                <tr>
                  <th>Bài</th>
                  <th>Tiêu đề</th>
                  <th>Xử lý</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {report.results.map((r) => (
                  <tr key={r.index}>
                    <td>{r.lessonNumber ?? `#${r.index + 1}`}</td>
                    <td>{r.titleVi || '—'}</td>
                    <td>
                      <span className={'class-status ' + ACTION_LABEL[r.action].cls}>{ACTION_LABEL[r.action].text}</span>
                    </td>
                    <td>
                      {r.errors.map((m, i) => (
                        <div key={'e' + i} className="lesson-import-error">
                          {m}
                        </div>
                      ))}
                      {r.warnings.map((m, i) => (
                        <div key={'w' + i} className="admin-table-vi">
                          {m}
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
