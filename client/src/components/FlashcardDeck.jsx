import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

// item.prompt = { hanzi, pinyin, meaning }
export default function FlashcardDeck({ lessonId, items = [] }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState({}); // exerciseItemId -> 'known'|'unknown'
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (user?.role !== 'student') return;
    api
      .get(`/lessons/${lessonId}/flashcard-reviews`)
      .then((res) => {
        const map = {};
        res.data.forEach((r) => (map[r.exerciseItemId] = r.status));
        setReviews(map);
      })
      .catch(() => {});
  }, [lessonId, user]);

  // Ưu tiên hiện lại thẻ "unknown"/chưa review trước
  const ordered = useMemo(() => {
    const rank = (it) => (reviews[it.id] === 'known' ? 2 : reviews[it.id] === 'unknown' ? 0 : 1);
    return [...items].sort((a, b) => rank(a) - rank(b));
  }, [items, reviews]);

  if (!ordered.length) return <div className="empty-state">Bài này chưa có thẻ từ vựng để ôn.</div>;

  const card = ordered[Math.min(index, ordered.length - 1)];
  const status = reviews[card.id];

  async function mark(newStatus) {
    setReviews((prev) => ({ ...prev, [card.id]: newStatus }));
    setFlipped(false);
    if (user?.role === 'student') {
      try {
        await api.post(`/lessons/${lessonId}/exercise-items/${card.id}/review`, { status: newStatus });
      } catch (err) {
        // giữ trạng thái lạc quan trên UI, không chặn luồng ôn tập nếu lưu lỗi
      }
    }
    setIndex((i) => Math.min(i + 1, ordered.length - 1));
  }

  const knownCount = ordered.filter((it) => reviews[it.id] === 'known').length;

  return (
    <div className="flashcard-deck">
      <p className="ex-desc">
        Thẻ {index + 1}/{ordered.length} · Đã thuộc: {knownCount}/{ordered.length}
      </p>
      <div className={'flashcard' + (flipped ? ' flipped' : '') + (status ? ` status-${status}` : '')} onClick={() => setFlipped((f) => !f)}>
        {!flipped ? (
          <div className="flashcard-face flashcard-front hanzi">{card.prompt?.hanzi}</div>
        ) : (
          <div className="flashcard-face flashcard-back">
            <div className="word-pinyin">{card.prompt?.pinyin}</div>
            <div className="meaning">{card.prompt?.meaning}</div>
          </div>
        )}
      </div>
      <div className="flashcard-actions">
        <button className="btn-secondary" onClick={() => mark('unknown')}>
          Chưa thuộc
        </button>
        <button className="btn-primary" onClick={() => mark('known')}>
          Đã thuộc
        </button>
      </div>
    </div>
  );
}
