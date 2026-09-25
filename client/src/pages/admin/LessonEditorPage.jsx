import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import Select from '../../components/ui/Select';
import Checkbox from '../../components/ui/Checkbox';
import Button from '../../components/ui/Button';
import BookLessonView from '../../components/book/BookLessonView';
import { VocabProgress } from '../../components/book/BookParts';
import { AddMenu, TextField } from '../../components/admin/book/EditorFields';
import {
  AudioEditor,
  DialogueTabEditor,
  ExerciseTabEditor,
  GrammarTabEditor,
  HeadEditor,
  NoteEditor,
  PhoneticsTabEditor,
  VocabTabEditor,
} from '../../components/admin/book/TabEditors';
import { TAB_META, TAB_KEYS, defaultFooter, normalizeLesson } from '../../lib/lessonContent';

const EMPTY_LESSON = {
  courseId: '',
  lessonNumber: '',
  seal: '',
  titleZh: '',
  titleVi: '',
  tag: 'Từ mới · Bài khóa · Ngữ âm/Ngữ pháp · Luyện tập',
  isPreview: false,
  published: true,
  vocab: [],
  properNouns: [],
  dialogues: [],
  phoneticsNotes: [],
  grammar: [],
  exercises: { blocks: [], textPages: [] },
  extra: { tabs: ['vocab', 'dialogue', 'phonetics', 'grammar', 'exercise'] },
  audioTracks: [],
  pages: [],
  exerciseItems: [],
};

const TAB_BODY = {
  vocab: VocabTabEditor,
  dialogue: DialogueTabEditor,
  phonetics: PhoneticsTabEditor,
  grammar: GrammarTabEditor,
  exercise: ExerciseTabEditor,
};

// Trình soạn bài học: sửa trực tiếp trên đúng giao diện giáo trình (book.css), bấm "Xem trước"
// để thấy chính xác trang học viên sẽ xem.
export default function LessonEditorPage({ mode }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lesson, setLesson] = useState(() =>
    mode === 'create' ? normalizeLesson({ ...EMPTY_LESSON, courseId: searchParams.get('courseId') || '' }) : null
  );
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('vocab');
  const [preview, setPreview] = useState(false);
  const [toolbarEl, setToolbarEl] = useState(null);

  // Thanh công cụ được ghim (sticky): đo chiều cao thật (có thể xuống dòng trên màn hình hẹp) để thanh tab
  // Từ mới / Bài khóa… của bài dính ngay bên dưới nó
  useEffect(() => {
    if (!toolbarEl) return;
    const host = toolbarEl.parentElement;
    const update = () => host.style.setProperty('--editor-toolbar-h', `${toolbarEl.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(toolbarEl);
    return () => ro.disconnect();
  }, [toolbarEl]);

  useEffect(() => {
    api.get('/admin/courses').then((res) => setCourses(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && id) {
      api
        .get(`/admin/lessons/${id}`)
        .then((res) => {
          const l = normalizeLesson(res.data);
          setLesson(l);
          setActiveTab(l.extra.tabs[0]);
        })
        .catch(() => setError('Không tải được bài học.'));
    }
  }, [mode, id]);

  // Gợi ý số bài tiếp theo khi tạo mới trong một khoá
  useEffect(() => {
    if (mode !== 'create' || !lesson?.courseId || lesson.lessonNumber) return;
    api
      .get('/admin/lessons', { params: { courseId: lesson.courseId } })
      .then((res) => {
        const next = res.data.reduce((m, l) => Math.max(m, l.lessonNumber || 0), 0) + 1;
        setLesson((l) => (l.lessonNumber ? l : { ...l, lessonNumber: next }));
      })
      .catch(() => {});
  }, [mode, lesson?.courseId, lesson?.lessonNumber]);

  function setField(field, value) {
    setLesson((l) => ({ ...l, [field]: typeof value === 'function' ? value(l[field]) : value }));
  }
  function setExtra(field, value) {
    setLesson((l) => ({ ...l, extra: { ...l.extra, [field]: value } }));
  }
  function setHead(key, head) {
    setLesson((l) => ({ ...l, extra: { ...l.extra, heads: { ...l.extra.heads, [key]: head } } }));
  }
  function setTabs(tabs) {
    setExtra('tabs', tabs);
    if (!tabs.includes(activeTab)) setActiveTab(tabs[0]);
  }
  function setAudio(category, listOrFn) {
    setLesson((l) => {
      const current = l.audioTracks.filter((t) => t.category === category);
      const next = typeof listOrFn === 'function' ? listOrFn(current) : listOrFn;
      return { ...l, audioTracks: [...l.audioTracks.filter((t) => t.category !== category), ...next] };
    });
  }

  async function handleSave() {
    setError('');
    if (!lesson.courseId) return setError('Chọn khoá học trước khi lưu.');
    if (!lesson.lessonNumber) return setError('Nhập số bài.');
    if (!lesson.titleVi?.trim()) return setError('Nhập phụ đề bài học (dòng in nghiêng dưới tiêu đề).');
    setSaving(true);
    try {
      const payload = { ...lesson, lessonNumber: Number(lesson.lessonNumber) };
      if (mode === 'create') {
        const res = await api.post('/admin/lessons', payload);
        toast.success('Đã tạo bài học mới.');
        navigate(`/admin/lessons/${res.data.id}/edit`, { replace: true });
      } else {
        const res = await api.put(`/admin/lessons/${id}`, payload);
        setLesson(normalizeLesson(res.data));
        toast.success('Đã lưu bài học.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thất bại.');
    } finally {
      setSaving(false);
    }
  }

  if (!lesson) {
    return (
      <main className="page">
        {error ? <div className="alert-error">{error}</div> : <div className="page-loading">Đang tải…</div>}
      </main>
    );
  }

  const tabs = lesson.extra.tabs;
  const current = tabs.includes(activeTab) ? activeTab : tabs[0];
  const heads = lesson.extra.heads;
  const footer = lesson.extra.footer || defaultFooter(lesson.lessonNumber);
  const missingTabs = TAB_KEYS.filter((k) => !tabs.includes(k));
  const audioCategory = current ? TAB_META[current].audio : null;
  const Body = current ? TAB_BODY[current] : null;

  const headAndAudio = current ? (
    <>
      <HeadEditor head={heads[current]} onChange={(h) => setHead(current, h)} noteInside={current === 'vocab'}>
        {current === 'vocab' ? <VocabProgress done={0} total={lesson.vocab.length} /> : null}
      </HeadEditor>
      {audioCategory ? (
        <AudioEditor
          category={audioCategory}
          tracks={lesson.audioTracks.filter((t) => t.category === audioCategory)}
          onChange={(list) => setAudio(audioCategory, list)}
        />
      ) : null}
      {current !== 'vocab' ? <NoteEditor value={heads[current].note} onChange={(v) => setHead(current, { ...heads[current], note: v })} /> : null}
    </>
  ) : null;

  return (
    <main className="page admin-editor-page">
      <div className="book-editor-toolbar" ref={setToolbarEl}>
        <div className="book-editor-toolbar-fields">
          <Select
            value={lesson.courseId}
            onChange={(v) => setField('courseId', v)}
            placeholder="-- Chọn khoá học --"
            options={courses.map((c) => ({ value: c.id, label: `${c.title}${c.hskLevel ? ` (${c.hskLevel})` : ''}` }))}
          />
          <label className="book-editor-number">
            Bài số
            <input type="number" min="1" value={lesson.lessonNumber} onChange={(e) => setField('lessonNumber', e.target.value === '' ? '' : Number(e.target.value))} />
          </label>
          <Checkbox checked={lesson.published} onChange={(e) => setField('published', e.target.checked)} label="Xuất bản" />
          <Checkbox checked={lesson.isPreview} onChange={(e) => setField('isPreview', e.target.checked)} label="Cho xem trước" />
        </div>
        <div className="book-editor-toolbar-actions">
          <Button variant="secondary" type="button" onClick={() => setPreview((p) => !p)}>
            {preview ? '✎ Tiếp tục soạn' : '👁 Xem trước'}
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu bài học'}
          </Button>
        </div>
      </div>
      {error && <div className="alert-error">{error}</div>}

      {preview ? (
        <div className="book-editor-preview">
          <BookLessonView lesson={normalizeLesson(lesson)} />
        </div>
      ) : (
        <div className="book-view book-editor">
          <div className="lesson-app active integrated-lesson">
            <header className="hero">
              <input className="seal be-seal" value={lesson.seal} onChange={(e) => setField('seal', e.target.value)} placeholder="一课" title="Con dấu" />
              <TextField className="be-h1" value={lesson.titleZh} onChange={(v) => setField('titleZh', v)} placeholder="第1课" />
              <TextField className="subtitle be-subtitle" value={lesson.titleVi} onChange={(v) => setField('titleVi', v)} placeholder="Bài 1 · 你好" />
              <TextField className="lesson-tag be-tag" value={lesson.tag} onChange={(v) => setField('tag', v)} placeholder="Từ mới · Bài khóa · Luyện tập" />
            </header>

            <nav className="tabs be-tabs">
              {tabs.map((key, i) => (
                <span key={key} className="be-tab">
                  <button type="button" className={key === current ? 'active' : ''} onClick={() => setActiveTab(key)}>
                    <span className="zh">{TAB_META[key].zh}</span>
                    {TAB_META[key].label}
                  </button>
                  <span className="be-tab-tools">
                    <button type="button" disabled={i === 0} title="Đưa tab sang trái" onClick={() => setTabs(tabs.map((t, j) => (j === i - 1 ? key : j === i ? tabs[i - 1] : t)))}>
                      ‹
                    </button>
                    <button
                      type="button"
                      disabled={i === tabs.length - 1}
                      title="Đưa tab sang phải"
                      onClick={() => setTabs(tabs.map((t, j) => (j === i + 1 ? key : j === i ? tabs[i + 1] : t)))}
                    >
                      ›
                    </button>
                    <button type="button" className="be-danger" title="Ẩn tab (nội dung vẫn giữ)" disabled={tabs.length === 1} onClick={() => setTabs(tabs.filter((t) => t !== key))}>
                      ×
                    </button>
                  </span>
                </span>
              ))}
              {missingTabs.length ? (
                <AddMenu
                  label="+ Thêm tab"
                  options={missingTabs.map((k) => ({ value: k, label: `${TAB_META[k].zh} ${TAB_META[k].label}` }))}
                  onPick={(k) => {
                    setTabs([...tabs, k]);
                    setActiveTab(k);
                  }}
                />
              ) : null}
            </nav>

            <main>
              {current ? (
                <section className="panel active">
                  {current === 'exercise' ? (
                    <ExerciseTabEditor lesson={lesson} setField={setField} setExtra={setExtra} head={headAndAudio} />
                  ) : (
                    <>
                      {headAndAudio}
                      <Body lesson={lesson} setField={setField} setExtra={setExtra} />
                    </>
                  )}
                </section>
              ) : null}
            </main>

            <footer>
              <TextField className="zh be-inline" value={footer.zh} onChange={(v) => setExtra('footer', { ...footer, zh: v })} placeholder="温故而知新" />{' '}
              <TextField className="be-inline be-wide" value={footer.text} onChange={(v) => setExtra('footer', { ...footer, text: v })} placeholder="· Ôn cũ biết mới — Bài 1" />
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
