import { useEffect, useMemo, useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

// Tính năng của hệ thống (không có trong file giáo trình): quiz chấm điểm + flashcard ôn từ,
// hiển thị bằng đúng các khối ex-block của giáo trình.

// canSubmit=false: lớp đã kết thúc (chỉ xem lại). onResult(submission) để trang cha cập nhật trạng thái hoàn thành bài.
function QuizItem({ lessonId, item, index, canSubmit = true, onResult }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isStudent = user?.role === 'student';

  async function handleSubmit() {
    if (selected == null) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/lessons/${lessonId}/exercise-items/${item.id}/submit`, { answer: { optionIndex: selected } });
      setResult(res.data);
      onResult?.(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tone-question graded-question">
      <div className="graded-question-title">
        Câu {index + 1}. {item.prompt?.question}
      </div>
      <div className="tone-options">
        {(item.prompt?.options || []).map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={!!result}
            className={result && selected === i ? (result.isCorrect ? 'correct' : 'wrong') : selected === i ? 'picked' : undefined}
            onClick={() => setSelected(i)}
          >
            {opt}
          </button>
        ))}
      </div>
      {!result ? (
        <button type="button" className="copy-exercise-text graded-submit" disabled={selected == null || submitting || !isStudent || !canSubmit} onClick={handleSubmit}>
          {!isStudent ? 'Chỉ học viên mới nộp bài được' : !canSubmit ? 'Lớp đã kết thúc — không nộp bài' : submitting ? 'Đang nộp…' : 'Nộp bài'}
        </button>
      ) : null}
      <div className="tone-result">
        {error ||
          (result ? (result.isCorrect ? `✓ Chính xác (+${result.score} điểm)` : '✗ Chưa đúng, xem lại từ vựng/ngữ pháp nhé.') : '')}
      </div>
    </div>
  );
}

export function GradedQuiz({ lessonId, items, number, canSubmit, onResult }) {
  if (!items.length) return null;
  return (
    <div className="ex-block">
      <h3>
        <span className="ex-num">{number}</span>
        <span className="hanzi">小测验</span> — Bài kiểm tra nhanh
      </h3>
      <p className="ex-desc">Chọn đáp án đúng rồi bấm &quot;Nộp bài&quot; để chấm điểm ngay.</p>
      <div className="tone-quiz graded-quiz">
        {items.map((item, i) => (
          <QuizItem key={item.id} lessonId={lessonId} item={item} index={i} canSubmit={canSubmit} onResult={onResult} />
        ))}
      </div>
    </div>
  );
}

export function FlashcardDeck({ lessonId, items, canSubmit = true }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState({});
  const [loadedReviews, setLoadedReviews] = useState({}); // trạng thái lúc mở bài — chỉ dùng để xếp thứ tự thẻ
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (user?.role !== 'student' || !lessonId) return;
    api
      .get(`/lessons/${lessonId}/flashcard-reviews`)
      .then((res) => {
        const map = {};
        res.data.forEach((r) => (map[r.exerciseItemId] = r.status));
        setReviews(map);
        setLoadedReviews(map);
      })
      .catch(() => {});
  }, [lessonId, user]);

  // Thẻ chưa thuộc lên trước, đã thuộc xuống cuối — xếp theo trạng thái lúc mở bài và giữ nguyên trong lúc ôn,
  // để bấm Trước/Sau không bị nhảy thẻ khi vừa đánh dấu.
  const ordered = useMemo(() => {
    const rank = (it) => (loadedReviews[it.id] === 'known' ? 2 : loadedReviews[it.id] === 'unknown' ? 0 : 1);
    return [...items].sort((a, b) => rank(a) - rank(b));
  }, [items, loadedReviews]);

  if (!ordered.length) return null;
  const current = Math.min(index, ordered.length - 1);
  const card = ordered[current];
  const status = reviews[card.id];
  const knownCount = ordered.filter((it) => reviews[it.id] === 'known').length;

  async function mark(newStatus) {
    setReviews((prev) => ({ ...prev, [card.id]: newStatus }));
    setFlipped(false);
    if (user?.role === 'student' && canSubmit) {
      try {
        await api.post(`/lessons/${lessonId}/exercise-items/${card.id}/review`, { status: newStatus });
      } catch {
        // giữ trạng thái trên giao diện, không chặn việc ôn tập nếu lưu lỗi
      }
    }
    setIndex((i) => Math.min(i + 1, ordered.length - 1));
  }

  function go(i) {
    setFlipped(false);
    setIndex(Math.max(0, Math.min(i, ordered.length - 1)));
  }

  return (
    <>
      <h3 className="group-title">
        卡片 <span className="vi">Flashcard ôn từ vựng</span>
      </h3>
      <div className="flashcard-deck">
        <div className="flashcard-nav">
          <button type="button" className="flashcard-nav-btn" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Thẻ trước">
            ‹
          </button>
          <p className="ex-desc">
            Thẻ {current + 1}/{ordered.length} · Đã thuộc: {knownCount}/{ordered.length}
          </p>
          <button
            type="button"
            className="flashcard-nav-btn"
            onClick={() => go(current + 1)}
            disabled={current === ordered.length - 1}
            aria-label="Thẻ sau"
          >
            ›
          </button>
        </div>
        {/* key theo thẻ: sang thẻ mới thì dựng lại ở mặt trước ngay, không chạy hiệu ứng lật về (tránh lộ nghĩa thẻ sau) */}
        <div
          key={card.id}
          className={'flashcard' + (flipped ? ' flipped' : '') + (status ? ` status-${status}` : '')}
          role="button"
          tabIndex={0}
          aria-label={flipped ? 'Lật về mặt chữ Hán' : 'Lật thẻ để xem phiên âm và nghĩa'}
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
        >
          <div className="flashcard-inner">
            <div className="flashcard-face flashcard-front" aria-hidden={flipped}>
              <div className="hanzi">{card.prompt?.hanzi}</div>
              <span className="flashcard-hint">Bấm để lật</span>
            </div>
            <div className="flashcard-face flashcard-back" aria-hidden={!flipped}>
              <div className="word-pinyin">{card.prompt?.pinyin}</div>
              <div className="meaning">{card.prompt?.meaning}</div>
            </div>
          </div>
        </div>
        {ordered.length > 1 && (
          <div className="flashcard-dots">
            {ordered.map((it, i) => (
              <button
                key={it.id}
                type="button"
                className={'flashcard-dot' + (i === current ? ' active' : '') + (reviews[it.id] ? ` ${reviews[it.id]}` : '')}
                onClick={() => go(i)}
                aria-label={`Thẻ ${i + 1}`}
              />
            ))}
          </div>
        )}
        <div className="flashcard-actions">
          <button type="button" className="copy-exercise-text" onClick={() => mark('unknown')}>
            Chưa thuộc
          </button>
          <button type="button" className="copy-exercise-text flashcard-known" onClick={() => mark('known')}>
            Đã thuộc
          </button>
        </div>
      </div>
    </>
  );
}
