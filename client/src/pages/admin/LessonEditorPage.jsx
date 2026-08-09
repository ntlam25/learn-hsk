import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import EditableHero from '../../components/admin/lesson/EditableHero';
import TabBar, { TAB_CATEGORIES } from '../../components/admin/lesson/TabBar';
import AudioSectionEditor from '../../components/admin/lesson/AudioSectionEditor';
import EditableVocabSection from '../../components/admin/lesson/EditableVocabSection';
import EditableDialogueSection from '../../components/admin/lesson/EditableDialogueSection';
import EditablePhoneticsSection from '../../components/admin/lesson/EditablePhoneticsSection';
import EditableGrammarSection from '../../components/admin/lesson/EditableGrammarSection';
import EditableExerciseSection from '../../components/admin/lesson/EditableExerciseSection';
import PageListEditor from '../../components/admin/lesson/PageListEditor';

const EMPTY_LESSON = {
  courseId: '',
  lessonNumber: '',
  seal: '',
  titleZh: '',
  titleVi: '',
  tag: 'Từ mới · Bài khóa · Luyện tập',
  isPreview: false,
  sourcePdfUrl: '',
  published: true,
  vocab: [],
  properNouns: [],
  dialogues: [],
  phoneticsNotes: [],
  grammar: [],
  exercises: {},
  extra: {},
  audioTracks: [],
  pages: [],
  exerciseItems: [],
};

const CONTENT_BY_TAB = {
  vocab: EditableVocabSection,
  dialogue: EditableDialogueSection,
  phonetics: EditablePhoneticsSection,
  grammar: EditableGrammarSection,
  exercise: EditableExerciseSection,
};

function hasExerciseContent(exercises, exerciseItems) {
  const ex = exercises || {};
  return (
    (exerciseItems || []).some((it) => it.kind !== 'flashcard') ||
    ex.questions?.length ||
    ex.homework?.length ||
    ex.chips?.length ||
    ex.phonetics?.length ||
    ex.textPages?.length ||
    !!ex.reading
  );
}

function computeActiveTabs(lesson) {
  const tabs = [];
  if (lesson.vocab?.length || lesson.properNouns?.length) tabs.push('vocab');
  if (lesson.dialogues?.length) tabs.push('dialogue');
  if (lesson.phoneticsNotes?.length) tabs.push('phonetics');
  if (lesson.grammar?.length) tabs.push('grammar');
  if (hasExerciseContent(lesson.exercises, lesson.exerciseItems)) tabs.push('exercise');
  return tabs.length ? tabs : ['vocab'];
}

export default function LessonEditorPage({ mode }) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lesson, setLesson] = useState(mode === 'create' ? { ...EMPTY_LESSON, courseId: searchParams.get('courseId') || '' } : null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTabs, setActiveTabs] = useState(mode === 'create' ? [] : []);
  const [activeTab, setActiveTab] = useState(null);

  useEffect(() => {
    api.get('/admin/courses').then((res) => setCourses(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (mode === 'edit' && id) {
      api
        .get(`/admin/lessons/${id}`)
        .then((res) => {
          setLesson(res.data);
          const tabs = computeActiveTabs(res.data);
          setActiveTabs(tabs);
          setActiveTab(tabs[0]);
        })
        .catch(() => setError('Không tải được bài học.'));
    }
  }, [mode, id]);

  function setField(field, value) {
    setLesson((l) => ({ ...l, [field]: value }));
  }

  function addTab(key) {
    setActiveTabs((tabs) => [...tabs, key]);
    setActiveTab(key);
  }

  function removeTab(key) {
    setActiveTabs((tabs) => {
      const next = tabs.filter((t) => t !== key);
      if (activeTab === key) setActiveTab(next[0] || null);
      return next;
    });
  }

  function setAudioTracksForCategory(category, tracksForCategory) {
    const others = (lesson.audioTracks || []).filter((t) => t.category !== category);
    setField('audioTracks', [...others, ...tracksForCategory]);
  }

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...lesson, lessonNumber: Number(lesson.lessonNumber) };
      if (mode === 'create') {
        const res = await api.post('/admin/lessons', payload);
        toast.success('Đã tạo bài học mới.');
        navigate(`/admin/lessons/${res.data.id}/edit`, { replace: true });
      } else {
        await api.put(`/admin/lessons/${id}`, payload);
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

  const activeMeta = TAB_CATEGORIES.find((c) => c.key === activeTab);
  const ContentComponent = activeTab ? CONTENT_BY_TAB[activeTab] : null;
  const audioTracksForTab = activeMeta?.audioCategory
    ? (lesson.audioTracks || []).filter((t) => t.category === activeMeta.audioCategory)
    : null;

  return (
    <main className="page lesson-view-page admin-editor-page">
      {error && <div className="alert-error">{error}</div>}

      <EditableHero lesson={lesson} courses={courses} onChange={setField} onSubmit={handleSubmit} saving={saving} />

      <div className="admin-pages-editor">
        <div className="sub-label">ẢNH TRANG SÁCH GỐC</div>
        <PageListEditor pages={lesson.pages || []} onChange={(v) => setField('pages', v)} />
      </div>

      <TabBar activeKeys={activeTabs} current={activeTab} onSelect={setActiveTab} onAdd={addTab} onRemove={removeTab} />

      {activeTab && (
        <section className="panel active">
          {audioTracksForTab !== null && (
            <AudioSectionEditor
              category={activeMeta.audioCategory}
              tracks={audioTracksForTab}
              onChange={(v) => setAudioTracksForCategory(activeMeta.audioCategory, v)}
            />
          )}
          {ContentComponent && <ContentComponent lesson={lesson} setField={setField} />}
        </section>
      )}

      {!activeTabs.length && <div className="empty-state">Bấm "+ Thêm tab" để bắt đầu thêm nội dung cho bài học.</div>}
    </main>
  );
}
