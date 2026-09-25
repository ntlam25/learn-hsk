import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createAutoStroke } from '../../lib/strokeWriter';
import { defaultFooter, vocabKey, DEFAULT_TEACHER_DIVIDER } from '../../lib/lessonContent';
import {
  AudioGroup,
  BookExercises,
  BookFooter,
  BookHero,
  BookTabs,
  DialogueCard,
  ExBlock,
  GrammarBlock,
  GroupTitle,
  LegacyVocabExtras,
  MiniNotes,
  PhoneticsHero,
  ProperNounTable,
  SectionHead,
  SourceNote,
  VocabCard,
  VocabProgress,
  hasBookExercises,
} from './BookParts';
import { FlashcardDeck, GradedQuiz } from './GradedExercises';
import PageLightbox from './PageLightbox';
import Html from './Html';

function readDone(storageKey) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}

function writeDone(storageKey, map) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(map));
  } catch {
    // trình duyệt chặn lưu trữ thì chỉ giữ trong phiên
  }
}

// Trang bài học dựng lại y hệt một ".lesson-app" của giáo trình gốc (hero, tab, 5 phần nội dung, footer).
// `lesson` phải đi qua normalizeLesson(). `top` là phần tử đặt trên cùng (menu chọn bài), `bottom` đặt cuối nội dung.
// Từ "đã thuộc" luôn được nhớ trong localStorage; khi có `savedDone` (danh sách khoá từ đã lưu trên server)
// thì gộp hai nguồn, và mỗi lần đổi sẽ gọi `onDoneChange(keys)` để trang cha lưu lên server.
// `canSubmit=false` (lớp đã kết thúc): quiz/flashcard chỉ xem, không nộp. `onQuizResult` nhận kết quả nộp quiz.
export default function BookLessonView({ lesson, top = null, bottom = null, savedDone, onDoneChange, canSubmit = true, onQuizResult, className = '' }) {
  const rootRef = useRef(null);
  const tabs = lesson.extra.tabs;
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [lightboxPage, setLightboxPage] = useState(null);
  const storageKey = `hanzi_vocab_done_${lesson.id || `new-${lesson.lessonNumber}`}`;
  const [doneMap, setDoneMap] = useState(() => readDone(storageKey));
  const autoStroke = useRef(null);

  const current = tabs.includes(activeTab) ? activeTab : tabs[0];

  useEffect(() => setDoneMap(readDone(storageKey)), [storageKey]);

  useEffect(() => {
    autoStroke.current = createAutoStroke(() => rootRef.current);
    return () => autoStroke.current?.destroy();
  }, []);

  useEffect(() => {
    autoStroke.current?.schedule(true, 420);
  }, [current, lesson.id]);

  // Chỉ phát một file nghe tại một thời điểm (như giáo trình)
  useEffect(() => {
    const root = rootRef.current;
    function onPlay(e) {
      if (e.target?.tagName !== 'AUDIO') return;
      root.querySelectorAll('audio').forEach((a) => a !== e.target && !a.paused && a.pause());
    }
    root.addEventListener('play', onPlay, true);
    return () => root.removeEventListener('play', onPlay, true);
  }, []);

  const keys = useMemo(() => lesson.vocab.map((e, i) => vocabKey(lesson, e, i)), [lesson]);

  // Danh sách từ đã lưu trên server về tới thì server là chuẩn. Riêng lần đồng bộ đầu tiên trên máy này,
  // gộp thêm các từ đã đánh dấu trong localStorage từ trước khi có lưu server rồi đẩy bản gộp lên.
  useEffect(() => {
    if (!Array.isArray(savedDone)) return;
    const syncedKey = `${storageKey}_synced`;
    let firstSync = true;
    try {
      firstSync = !localStorage.getItem(syncedKey);
      localStorage.setItem(syncedKey, '1');
    } catch {
      // bỏ qua
    }
    const local = readDone(storageKey);
    const merged = {};
    savedDone.forEach((k) => (merged[k] = true));
    const extra = firstSync ? keys.filter((k) => local[k] && !merged[k]) : [];
    extra.forEach((k) => (merged[k] = true));
    setDoneMap(merged);
    writeDone(storageKey, merged);
    if (extra.length) onDoneChange?.(keys.filter((k) => merged[k]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedDone, storageKey]);

  const toggleDone = useCallback(
    (key) => {
      const next = { ...doneMap, [key]: !doneMap[key] };
      setDoneMap(next);
      writeDone(storageKey, next);
      onDoneChange?.(keys.filter((k) => next[k]));
    },
    [doneMap, storageKey, keys, onDoneChange]
  );

  const audioByCategory = useMemo(() => {
    const map = {};
    lesson.audioTracks.forEach((t) => (map[t.category] = [...(map[t.category] || []), t]));
    return map;
  }, [lesson.audioTracks]);

  const flashcards = (lesson.exerciseItems || []).filter((it) => it.kind === 'flashcard');
  const quizItems = (lesson.exerciseItems || []).filter((it) => it.kind === 'quiz');
  const { extra } = lesson;
  const heads = extra.heads;
  const doneCount = keys.filter((k) => doneMap[k]).length;

  function renderTab(key) {
    const head = heads[key];
    switch (key) {
      case 'vocab':
        return (
          <>
            <SectionHead head={head}>
              <SourceNote html={head.note} />
              <VocabProgress done={doneCount} total={keys.length} />
            </SectionHead>
            <AudioGroup category="vocab" tracks={audioByCategory.vocab} />
            <div className="vocab-grid book-vocab-grid">
              {lesson.vocab.map((entry, i) => (
                <VocabCard key={keys[i] + i} entry={entry} vocabKey={keys[i]} done={!!doneMap[keys[i]]} onToggle={() => toggleDone(keys[i])} />
              ))}
            </div>
            {lesson.properNouns.length ? (
              <>
                <GroupTitle zh={extra.properNounsTitle?.zh || '专名'} vi={extra.properNounsTitle?.vi || 'Tên riêng'} />
                <ProperNounTable rows={lesson.properNouns} />
              </>
            ) : null}
            <LegacyVocabExtras extra={extra} />
            <FlashcardDeck lessonId={lesson.id} items={flashcards} canSubmit={canSubmit} />
          </>
        );
      case 'dialogue':
        return (
          <>
            <SectionHead head={head} />
            <AudioGroup category="text" tracks={audioByCategory.text} />
            <SourceNote html={head.note} />
            {lesson.dialogues.map((d, i) => (
              <DialogueCard key={i} dialogue={d} />
            ))}
          </>
        );
      case 'phonetics':
        return (
          <>
            <SectionHead head={head} />
            <AudioGroup category="phonetics" tracks={audioByCategory.phonetics} />
            <SourceNote html={head.note} />
            {extra.phoneticsHero ? <PhoneticsHero hero={extra.phoneticsHero} /> : null}
            {lesson.phoneticsNotes.length ? <MiniNotes notes={lesson.phoneticsNotes} /> : null}
            {extra.phoneticsBlocks.map((b, i) => (
              <ExBlock key={i} block={b} number={i + 1} />
            ))}
          </>
        );
      case 'grammar':
        return (
          <>
            <SectionHead head={head} />
            <SourceNote html={head.note} />
            {lesson.grammar.map((g, i) => (
              <GrammarBlock key={i} item={g} number={i + 1} />
            ))}
          </>
        );
      case 'exercise': {
        const blocks = lesson.exercises.blocks || [];
        return (
          <>
            {hasBookExercises(lesson) ? (
              <>
                <BookExercises lesson={lesson} onOpenPage={setLightboxPage} />
                <Html as="div" className="teacher-extra-divider" html={extra.teacherDivider || DEFAULT_TEACHER_DIVIDER} />
              </>
            ) : null}
            <SectionHead head={head} />
            <AudioGroup category="practice" tracks={audioByCategory.practice} />
            <SourceNote html={head.note} />
            {blocks.map((b, i) => (
              <ExBlock key={i} block={b} number={i + 1} />
            ))}
            <GradedQuiz lessonId={lesson.id} items={quizItems} number={blocks.length + 1} canSubmit={canSubmit} onResult={onQuizResult} />
          </>
        );
      }
      default:
        return null;
    }
  }

  return (
    <div className={'book-view' + (className ? ' ' + className : '')} ref={rootRef}>
      {top}
      <div className="lesson-app active integrated-lesson" data-lesson-number={lesson.lessonNumber}>
        <BookHero lesson={lesson} />
        <BookTabs tabs={tabs} active={current} onSelect={setActiveTab} />
        <main>
          {tabs.map((key) => (
            <section key={key} className={'panel' + (key === current ? ' active' : '')} data-tab-key={key}>
              {renderTab(key)}
            </section>
          ))}
          {bottom}
        </main>
        <BookFooter footer={extra.footer || defaultFooter(lesson.lessonNumber)} />
      </div>
      <PageLightbox page={lightboxPage} onClose={() => setLightboxPage(null)} />
    </div>
  );
}

