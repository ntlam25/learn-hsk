import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import VocabCard from '../components/VocabCard';
import DialogueBlock from '../components/DialogueBlock';
import ExerciseBlock from '../components/ExerciseBlock';
import FlashcardDeck from '../components/FlashcardDeck';
import PhoneticsNotes from '../components/PhoneticsNotes';
import GrammarList from '../components/GrammarList';
import LessonAudioGroup from '../components/LessonAudioGroup';
import LessonPagesViewer from '../components/LessonPagesViewer';
import ProperNounTable from '../components/ProperNounTable';
import CountryTable from '../components/CountryTable';
import ExtensionChipGrid from '../components/ExtensionChipGrid';

export default function LessonViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('vocab');

  useEffect(() => {
    setLesson(null);
    setError('');
    setTab('vocab');
    api
      .get(`/lessons/${id}`)
      .then((res) => setLesson(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || 'Không tìm thấy bài học này (có thể đã bị ẩn hoặc bạn chưa có quyền xem).')
      );
  }, [id]);

  useEffect(() => {
    if (lesson && user?.role === 'student') {
      api.post(`/lessons/${id}/progress`, { status: 'in_progress' }).catch(() => {});
    }
  }, [lesson, id, user]);

  const audioByCategory = useMemo(() => {
    const map = {};
    (lesson?.audioTracks || []).forEach((t) => {
      map[t.category] = map[t.category] || [];
      map[t.category].push(t);
    });
    return map;
  }, [lesson]);

  const flashcardItems = useMemo(() => (lesson?.exerciseItems || []).filter((it) => it.kind === 'flashcard'), [lesson]);
  const quizItems = useMemo(() => (lesson?.exerciseItems || []).filter((it) => it.kind === 'quiz'), [lesson]);

  if (error) {
    return (
      <main className="page">
        <div className="alert-error">{error}</div>
        {!user && (
          <p>
            <Link to="/login" className="btn-ghost">
              Đăng nhập
            </Link>
          </p>
        )}
        <Link to="/" className="btn-ghost">
          ← Về danh sách khoá học
        </Link>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="page">
        <div className="page-loading">Đang tải bài học…</div>
      </main>
    );
  }

  const countries = lesson.extra?.countries;
  const extensions = lesson.extra?.extensions;

  const TABS = [
    { key: 'vocab', label: 'Từ mới', zh: '生词' },
    { key: 'dialogue', label: 'Bài khóa', zh: '课文' },
    lesson.phoneticsNotes?.length ? { key: 'phonetics', label: 'Ngữ âm', zh: '语音' } : null,
    lesson.grammar?.length ? { key: 'grammar', label: 'Ngữ pháp', zh: '语法' } : null,
    { key: 'exercise', label: 'Luyện tập', zh: '练习' },
  ].filter(Boolean);

  return (
    <main className="page lesson-view-page">
      <header className="hero">
        <div className="seal">{lesson.seal}</div>
        <h1>{lesson.titleZh}</h1>
        <p className="subtitle">{lesson.titleVi}</p>
        <span className="lesson-tag">{lesson.tag}</span>
      </header>

      <LessonPagesViewer pages={lesson.pages} sourcePdfUrl={lesson.sourcePdfUrl} />

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            <span className="zh">{t.zh}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <section className={'panel' + (tab === 'vocab' ? ' active' : '')}>
        <LessonAudioGroup tracks={audioByCategory.vocab} />

        {lesson.vocab?.length ? (
          <div className="vocab-grid">
            {lesson.vocab.map((entry, i) => (
              <VocabCard key={i} entry={entry} showNum />
            ))}
          </div>
        ) : (
          <div className="empty-state">Bài này chưa có từ vựng.</div>
        )}

        {lesson.properNouns?.length ? (
          <>
            <h2 className="section-title">专名 · Danh từ riêng</h2>
            <ProperNounTable entries={lesson.properNouns} />
          </>
        ) : null}

        {countries?.length ? (
          <>
            <h2 className="section-title">国家 · Tên các nước</h2>
            <CountryTable countries={countries} />
          </>
        ) : null}

        {extensions?.length ? (
          <>
            <h2 className="section-title">扩展词汇 · Từ mở rộng</h2>
            <ExtensionChipGrid extensions={extensions} />
          </>
        ) : null}

        {flashcardItems.length > 0 && (
          <>
            <h2 className="section-title">卡片 · Ôn từ vựng bằng Flashcard</h2>
            <FlashcardDeck lessonId={lesson.id} items={flashcardItems} />
          </>
        )}
      </section>

      <section className={'panel' + (tab === 'dialogue' ? ' active' : '')}>
        <LessonAudioGroup tracks={audioByCategory.text} />
        {lesson.dialogues?.length ? (
          lesson.dialogues.map((d, i) => <DialogueBlock key={i} dialogue={d} />)
        ) : (
          <div className="empty-state">Bài này chưa có bài khóa.</div>
        )}
      </section>

      {lesson.phoneticsNotes?.length ? (
        <section className={'panel' + (tab === 'phonetics' ? ' active' : '')}>
          <LessonAudioGroup tracks={audioByCategory.phonetics} />
          <PhoneticsNotes notes={lesson.phoneticsNotes} />
        </section>
      ) : null}

      {lesson.grammar?.length ? (
        <section className={'panel' + (tab === 'grammar' ? ' active' : '')}>
          <GrammarList items={lesson.grammar} />
        </section>
      ) : null}

      <section className={'panel' + (tab === 'exercise' ? ' active' : '')}>
        <LessonAudioGroup tracks={audioByCategory.practice} />
        <ExerciseBlock lessonId={lesson.id} exercises={lesson.exercises} quizItems={quizItems} />
      </section>
    </main>
  );
}
