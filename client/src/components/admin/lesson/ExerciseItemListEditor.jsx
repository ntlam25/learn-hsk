import Select from '../../ui/Select';
import { RadioGroup } from '../../ui/Radio';
import StringListEditor from './StringListEditor';

const KIND_OPTIONS = [
  { value: 'quiz', label: 'Trắc nghiệm' },
  { value: 'flashcard', label: 'Flashcard' },
];

function emptyQuiz() {
  return { kind: 'quiz', type: 'multiple_choice', prompt: { question: '', options: ['', ''] }, correctAnswer: { optionIndex: 0 }, points: 1 };
}

function emptyFlashcard() {
  return { kind: 'flashcard', prompt: { hanzi: '', pinyin: '', meaning: '' } };
}

function QuizItemEditor({ item, index, onChange }) {
  const options = item.prompt?.options || [];
  const optionIndex = item.correctAnswer?.optionIndex ?? 0;

  function setPrompt(field, val) {
    onChange({ ...item, prompt: { ...item.prompt, [field]: val } });
  }
  function setOptions(next) {
    const clampedIndex = Math.min(optionIndex, Math.max(0, next.length - 1));
    onChange({ ...item, prompt: { ...item.prompt, options: next }, correctAnswer: { optionIndex: clampedIndex } });
  }

  return (
    <>
      <textarea placeholder="Câu hỏi" value={item.prompt?.question || ''} onChange={(e) => setPrompt('question', e.target.value)} />
      <div className="sub-label">CÁC LỰA CHỌN</div>
      <StringListEditor items={options} onChange={setOptions} addLabel="+ Thêm lựa chọn" placeholder="Nội dung lựa chọn" />
      <div className="sub-label">ĐÁP ÁN ĐÚNG</div>
      <RadioGroup
        name={`quiz-correct-${index}`}
        value={optionIndex}
        onChange={(v) => onChange({ ...item, correctAnswer: { optionIndex: v } })}
        options={options.map((opt, i) => ({ value: i, label: opt || `Lựa chọn ${i + 1}` }))}
      />
      <input
        type="number"
        placeholder="Điểm"
        value={item.points ?? 1}
        onChange={(e) => onChange({ ...item, points: e.target.value === '' ? '' : Number(e.target.value) })}
      />
    </>
  );
}

function FlashcardItemEditor({ item, onChange }) {
  function setPrompt(field, val) {
    onChange({ ...item, prompt: { ...item.prompt, [field]: val } });
  }
  return (
    <div className="field-row">
      <input placeholder="汉字" value={item.prompt?.hanzi || ''} onChange={(e) => setPrompt('hanzi', e.target.value)} />
      <input placeholder="Pinyin" value={item.prompt?.pinyin || ''} onChange={(e) => setPrompt('pinyin', e.target.value)} />
      <input placeholder="Nghĩa" value={item.prompt?.meaning || ''} onChange={(e) => setPrompt('meaning', e.target.value)} />
    </div>
  );
}

export default function ExerciseItemListEditor({ items, onChange }) {
  function update(i, val) {
    onChange(items.map((it, idx) => (idx === i ? val : it)));
  }
  function changeKind(i, kind) {
    update(i, kind === 'flashcard' ? emptyFlashcard() : emptyQuiz());
  }
  function add() {
    onChange([...items, emptyQuiz()]);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="exercise-item-list-editor">
      {items.map((item, i) => (
        <div key={i} className="vocab-entry-editor">
          <div className="vocab-entry-editor-head">
            <Select value={item.kind} onChange={(v) => changeKind(i, v)} options={KIND_OPTIONS} />
            <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá câu">
              Xoá
            </button>
          </div>
          {item.kind === 'flashcard' ? (
            <FlashcardItemEditor item={item} onChange={(v) => update(i, v)} />
          ) : (
            <QuizItemEditor item={item} index={i} onChange={(v) => update(i, v)} />
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}>
        + Thêm câu hỏi/thẻ từ
      </button>
    </div>
  );
}
