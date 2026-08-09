import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { RadioGroup } from './ui/Radio';
import Button from './ui/Button';

function TextExtractPage({ page }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard?.writeText(page.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="exercise-text-page">
      <div className="exercise-text-page-head">
        <strong>Trang {page.pageNumber}</strong>
        <button type="button" className="btn-ghost-sm copy-exercise-text" onClick={handleCopy}>
          {copied ? 'Đã copy ✓' : 'Sao chép'}
        </button>
      </div>
      <pre className="exercise-copyable-text">{page.text}</pre>
    </article>
  );
}

function Chip({ hanzi, sub }) {
  const [done, setDone] = useState(false);
  return (
    <div className={'practice-chip' + (done ? ' done' : '')} onClick={() => setDone((d) => !d)}>
      <div className="ph">{hanzi}</div>
      {sub ? <div className="pp">{sub}</div> : null}
    </div>
  );
}

function ChipGroup({ title, desc, items }) {
  return (
    <div className="ex-block">
      {title ? (
        <h3>
          <span className="hanzi">{title}</span>
        </h3>
      ) : null}
      {desc ? <p className="ex-desc">{desc}</p> : null}
      <div className="practice-grid">
        {items.map((item, i) => {
          const [hanzi, sub] = Array.isArray(item) ? item : [item, ''];
          return <Chip key={i} hanzi={hanzi} sub={sub} />;
        })}
      </div>
    </div>
  );
}

function SentenceList({ questions }) {
  return (
    <div className="ex-block">
      <h3>回答问题 · Trả lời câu hỏi</h3>
      <p className="ex-desc">Trả lời thành câu hoàn chỉnh bằng tiếng Trung, không chỉ trả lời một từ.</p>
      <div className="sentence-list">
        {questions.map((q, i) => (
          <SentenceItem key={i} index={i} text={q} />
        ))}
      </div>
    </div>
  );
}

function SentenceItem({ index, text }) {
  const [done, setDone] = useState(false);
  return (
    <div className={'sentence-item' + (done ? ' done' : '')} onClick={() => setDone((d) => !d)}>
      <span className="sentence-num">({index + 1})</span>
      <span className="hanzi">{text}</span>
    </div>
  );
}

// item.prompt = { question, options: string[] }; item.correctAnswer = { optionIndex }
function QuizItem({ lessonId, item, index }) {
  const { user } = useAuth();
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null); // { isCorrect, score }
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (selected == null) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/lessons/${lessonId}/exercise-items/${item.id}/submit`, {
        answer: { optionIndex: selected },
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Nộp bài thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ex-block quiz-item">
      <h4>
        Câu {index + 1}. {item.prompt?.question}
      </h4>
      <RadioGroup
        name={`quiz-${item.id}`}
        value={selected}
        onChange={setSelected}
        disabled={!!result}
        options={(item.prompt?.options || []).map((opt, i) => ({ value: i, label: opt }))}
      />
      {error && <div className="alert-error">{error}</div>}
      {!result ? (
        <Button disabled={selected == null || submitting || user?.role !== 'student'} onClick={handleSubmit}>
          {user?.role !== 'student' ? 'Chỉ học viên mới nộp bài được' : submitting ? 'Đang nộp…' : 'Nộp bài'}
        </Button>
      ) : (
        <div className={'quiz-result ' + (result.isCorrect ? 'correct' : 'incorrect')}>
          {result.isCorrect ? `✓ Chính xác (+${result.score} điểm)` : '✗ Chưa đúng, xem lại từ vựng/ngữ pháp nhé.'}
        </div>
      )}
    </div>
  );
}

export default function ExerciseBlock({ lessonId, exercises = {}, quizItems = [] }) {
  const { phonetics = [], chips = [], questions = [], reading, homework = [], textPages = [] } = exercises;

  const hasStatic = phonetics.length || chips.length || questions.length || reading || homework.length || textPages.length;

  return (
    <div className="exercise-wrap">
      {quizItems.length > 0 && (
        <div className="ex-block">
          <h3>小测验 · Bài kiểm tra nhanh</h3>
          <p className="ex-desc">Chọn đáp án đúng rồi bấm "Nộp bài" để chấm điểm ngay.</p>
        </div>
      )}
      {quizItems.map((item, i) => (
        <QuizItem key={item.id} lessonId={lessonId} item={item} index={i} />
      ))}

      {phonetics.map((block, i) => (
        <ChipGroup key={`ph-${i}`} title={block.subtitle} items={block.items} />
      ))}
      {chips.map((block, i) => (
        <ChipGroup key={`ch-${i}`} title={block.title} desc={block.desc} items={block.items} />
      ))}
      {questions.length ? <SentenceList questions={questions} /> : null}
      {reading ? (
        <div className="ex-block">
          <h3>短文朗读 · Đọc đoạn văn</h3>
          <p className="ex-desc">Ngắt nghỉ theo cụm nghĩa, sau đó thuật lại mà không nhìn văn bản.</p>
          <div className="reading-box">{reading}</div>
        </div>
      ) : null}
      {homework.length ? (
        <div className="ex-block">
          <h3>课后任务 · Bài tập về nhà</h3>
          <div className="homework-list">
            {homework.map((h, i) => (
              <div key={i} className="homework-item">
                ✓ {h}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {textPages.length ? (
        <div className="ex-block exercise-text-extract">
          <h3>课本练习 · Trích văn bản bài tập</h3>
          <p className="ex-desc">Bấm "Sao chép" để lấy nội dung trang bài tập, dán vào nơi cần dùng.</p>
          <div className="exercise-text-pages">
            {textPages.map((p, i) => (
              <TextExtractPage key={i} page={p} />
            ))}
          </div>
        </div>
      ) : null}

      {!hasStatic && !quizItems.length ? <div className="empty-state">Bài này chưa có nội dung luyện tập.</div> : null}
    </div>
  );
}
