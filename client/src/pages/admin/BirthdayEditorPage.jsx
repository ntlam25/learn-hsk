import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/client';
import FileUploadField from '../../components/ui/FileUploadField';
import { useToast } from '../../context/ToastContext';
import { MAX_TREE_WISHES, nameLetters, normalizeContent, SLUG } from '../../components/birthday/data';

const PAGE_PATH = '/sinh-nhat-mai';

function move(list, i, d) {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// Trang quản trị: sửa nội dung trang mừng sinh nhật + xem điều ước đã được treo
export default function BirthdayEditorPage() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingMany, setUploadingMany] = useState(false);
  const [wishes, setWishes] = useState(null);

  useEffect(() => {
    api
      .get(`/birthday/pages/${SLUG}`)
      .then((res) => {
        setForm(normalizeContent(res.data?.content));
        setUpdatedAt(res.data?.updatedAt);
      })
      .catch(() => {
        toast.error('Không tải được nội dung, đang hiện nội dung mặc định.');
        setForm(normalizeContent(null));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // toast là object mới mỗi lần render → giữ qua ref để loadWishes không đổi (tránh tải lại liên tục)
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const loadWishes = useCallback(() => {
    api
      .get('/admin/birthday/wishes', { params: { recipient: SLUG } })
      .then((res) => setWishes(res.data.wishes || []))
      .catch((err) => {
        setWishes([]);
        toastRef.current.error(err.response?.data?.message || 'Không tải được danh sách điều ước.');
      });
  }, []);
  useEffect(loadWishes, [loadWishes]);

  // Cảnh báo khi rời trang mà chưa lưu
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  if (!form) return <div className="page-loading">Đang tải…</div>;

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setDirty(true);
  };
  const setPhoto = (i, patch) => set({ photos: form.photos.map((p, k) => (k === i ? { ...p, ...patch } : p)) });
  const letters = nameLetters(form.name);

  async function save() {
    setSaving(true);
    try {
      const content = {
        ...form,
        // bóng thứ i ↔ chữ cái thứ i của tên; cắt bớt lời chúc thừa khi tên ngắn lại
        balloonWishes: letters.map((_, i) => form.balloonWishes[i] || ''),
        photos: form.photos.filter((p) => p.src),
        treeWishes: form.treeWishes.map((s) => s.trim()).filter(Boolean),
      };
      const res = await api.put(`/admin/birthday/pages/${SLUG}`, { content });
      setForm(normalizeContent(res.data.content));
      setUpdatedAt(res.data.updatedAt);
      setDirty(false);
      toast.success('Đã lưu nội dung trang sinh nhật.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  }

  async function uploadMany(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploadingMany(true);
    const added = [];
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', 'birthday');
        const res = await api.post('/admin/uploads', fd);
        added.push({ src: res.data.url, cap: '', memo: '' });
      } catch (err) {
        toast.error(`${file.name}: ${err.response?.data?.message || 'tải lên thất bại'}`);
      }
    }
    setUploadingMany(false);
    if (added.length) {
      setForm((f) => ({ ...f, photos: [...f.photos, ...added] }));
      setDirty(true);
      toast.success(`Đã tải lên ${added.length} ảnh. Nhớ bấm "Lưu thay đổi".`);
    }
  }

  return (
    <main className="page admin-dashboard-page bday-admin">
      <div className="admin-header">
        <h1>Trang sinh nhật</h1>
        <div className="admin-header-actions">
          <a className="btn-secondary" href={PAGE_PATH} target="_blank" rel="noreferrer">
            Xem trang ↗
          </a>
          <button type="button" className="btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? 'Đang lưu…' : dirty ? 'Lưu thay đổi' : 'Đã lưu'}
          </button>
        </div>
      </div>
      <p className="field-hint">
        Link gửi cho người nhận: <b>{window.location.origin + PAGE_PATH}</b>
        {updatedAt && ` · Lưu lần cuối ${new Date(updatedAt).toLocaleString('vi-VN')}`}
      </p>

      <div className="lesson-form">
        <fieldset>
          <legend>Thông tin chung</legend>
          <div className="field-row">
            <label>
              Tên người được chúc
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} maxLength={20} />
            </label>
            <label>
              Ngày sinh
              <input type="date" value={form.birthDate} onChange={(e) => e.target.value && set({ birthDate: e.target.value })} />
            </label>
          </div>
          <div className="field-row">
            <label>
              Người gửi
              <input value={form.sender} onChange={(e) => set({ sender: e.target.value })} maxLength={40} />
            </label>
            <label>
              Ký tên cuối thư
              <input value={form.signature} onChange={(e) => set({ signature: e.target.value })} maxLength={80} />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Bóng bay ({letters.length} quả)</legend>
          <p className="field-hint">Mỗi quả bóng mang một chữ cái của tên. Nổ bóng sẽ rơi ra lời chúc tương ứng.</p>
          {letters.map((ch, i) => (
            <label key={i} className="bday-admin-inline">
              <span className="bday-admin-letter">{ch}</span>
              <input
                value={form.balloonWishes[i] || ''}
                maxLength={60}
                placeholder="Lời chúc khi nổ bóng"
                onChange={(e) => {
                  const next = [...form.balloonWishes];
                  next[i] = e.target.value;
                  set({ balloonWishes: next });
                }}
              />
            </label>
          ))}
        </fieldset>

        <fieldset>
          <legend>Ảnh kỷ niệm ({form.photos.length})</legend>
          <p className="field-hint">
            Ảnh được tải lên Supabase Storage (thư mục <code>birthday</code>). Chưa có ảnh nào thì trang hiện các ô màu thay thế.
          </p>
          {form.photos.map((p, i) => (
            <div key={i} className="bday-admin-photo">
              <FileUploadField
                value={p.src}
                onChange={(url) => setPhoto(i, { src: url })}
                folder="birthday"
                accept="image/*"
                previewKind="image"
              />
              <div className="bday-admin-photo-fields">
                <label>
                  Chú thích (dưới ảnh)
                  <input value={p.cap} maxLength={40} onChange={(e) => setPhoto(i, { cap: e.target.value })} />
                </label>
                <label>
                  Kỷ niệm (hiện khi phóng to)
                  <textarea rows={2} value={p.memo} maxLength={200} onChange={(e) => setPhoto(i, { memo: e.target.value })} />
                </label>
              </div>
              <div className="bday-admin-photo-actions">
                <button type="button" className="btn-ghost-sm" onClick={() => set({ photos: move(form.photos, i, -1) })} disabled={i === 0} title="Lên">
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={() => set({ photos: move(form.photos, i, 1) })}
                  disabled={i === form.photos.length - 1}
                  title="Xuống"
                >
                  ↓
                </button>
                <button type="button" className="btn-icon-danger" onClick={() => set({ photos: form.photos.filter((_, k) => k !== i) })} title="Bỏ ảnh">
                  ×
                </button>
              </div>
            </div>
          ))}
          <div className="bday-admin-row">
            <label className="btn-secondary bday-admin-file">
              {uploadingMany ? 'Đang tải lên…' : '+ Tải lên nhiều ảnh'}
              <input type="file" accept="image/*" multiple hidden onChange={uploadMany} disabled={uploadingMany} />
            </label>
            <button type="button" className="btn-ghost" onClick={() => set({ photos: [...form.photos, { src: '', cap: '', memo: '' }] })}>
              + Thêm 1 ô ảnh
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Cây ước nguyện · lời chúc treo sẵn ({form.treeWishes.length}/{MAX_TREE_WISHES})</legend>
          {form.treeWishes.map((w, i) => (
            <div key={i} className="bday-admin-inline">
              <input
                value={w}
                maxLength={60}
                onChange={(e) => set({ treeWishes: form.treeWishes.map((x, k) => (k === i ? e.target.value : x)) })}
              />
              <button type="button" className="btn-icon-danger" onClick={() => set({ treeWishes: form.treeWishes.filter((_, k) => k !== i) })} title="Xoá">
                ×
              </button>
            </div>
          ))}
          {form.treeWishes.length < MAX_TREE_WISHES && (
            <button type="button" className="btn-ghost" onClick={() => set({ treeWishes: [...form.treeWishes, ''] })}>
              + Thêm lời chúc
            </button>
          )}
        </fieldset>

        <fieldset>
          <legend>Lá thư</legend>
          <p className="field-hint">
            Viết <code>{'{age}'}</code> ở chỗ muốn hiện số tuổi. Xuống dòng trống để tách đoạn.
          </p>
          <label>
            <textarea rows={12} value={form.letter} onChange={(e) => set({ letter: e.target.value })} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Điều ước đã được treo {wishes ? `(${wishes.length})` : ''}</legend>
          <div className="bday-admin-row">
            <button type="button" className="btn-ghost-sm" onClick={loadWishes}>
              ↻ Tải lại
            </button>
          </div>
          {wishes == null ? (
            <div className="page-loading">Đang tải…</div>
          ) : wishes.length === 0 ? (
            <p className="field-hint">Chưa có điều ước nào.</p>
          ) : (
            <ul className="bday-admin-wishes">
              {wishes.map((w) => (
                <li key={w.id}>
                  <span>{w.content}</span>
                  <time>{new Date(w.created_at).toLocaleString('vi-VN')}</time>
                </li>
              ))}
            </ul>
          )}
        </fieldset>
      </div>
    </main>
  );
}
