import { useId } from 'react';
import { AddButton, AddMenu, AreaField, ItemControls, TextField, listOps } from './EditorFields';
import { DEFAULT_TONE_WRONG_TEXT, PART_TYPES } from '../../../lib/lessonContent';

export function emptyPart(type) {
  switch (type) {
    case 'subtitle':
      return { type, html: '' };
    case 'chips':
      return { type, items: [{ ph: '', pp: '' }] };
    case 'pinyin':
    case 'homework':
      return { type, items: [type === 'homework' ? '✓ ' : ''] };
    case 'sentences':
      return { type, hanzi: true, items: [''] };
    case 'reading':
      return { type, prose: false, html: '' };
    case 'toneQuiz':
      return { type, wrongText: DEFAULT_TONE_WRONG_TEXT, items: [{ word: '', options: ['', '', ''], answer: 0, note: '' }] };
    case 'extensions':
      return { type, items: [{ h: '', p: '', m: '' }] };
    default:
      return { type: 'subtitle', html: '' };
  }
}

export function emptyBlock() {
  return { title: '', desc: '', parts: [emptyPart('chips')] };
}

const PART_OPTIONS = Object.entries(PART_TYPES).map(([value, label]) => ({ value, label }));

function StringItems({ items, onChange, className, placeholder, render }) {
  return (
    <>
      {items.map((it, i) => (
        <div key={i} className={className + ' be-item'}>
          {render ? render(it, i) : <TextField value={it} onChange={(v) => onChange(listOps.update(items, i, v))} placeholder={placeholder} />}
          <ItemControls index={i} count={items.length} onRemove={(idx) => onChange(listOps.remove(items, idx))} />
        </div>
      ))}
    </>
  );
}

function PartEditor({ part, onChange }) {
  const uid = useId();
  const set = (fields) => onChange({ ...part, ...fields });
  const items = part.items || [];
  const setItems = (next) => set({ items: next });

  switch (part.type) {
    case 'subtitle':
      return <TextField className="ex-subtitle" value={part.html} onChange={(v) => set({ html: v })} placeholder="(1) 辨音辨调 — Phân biệt âm, thanh điệu" />;
    case 'chips':
      return (
        <div className="practice-grid">
          {items.map((it, i) => (
            <div key={i} className="practice-chip be-item">
              <TextField className="ph" value={it.ph} onChange={(v) => setItems(listOps.patch(items, i, { ph: v }))} placeholder="汉字 / nội dung" />
              <TextField className="pp" value={it.pp} onChange={(v) => setItems(listOps.patch(items, i, { pp: v }))} placeholder="pinyin (tuỳ chọn)" />
              <ItemControls index={i} count={items.length} onRemove={(idx) => setItems(listOps.remove(items, idx))} />
            </div>
          ))}
          <AddButton onClick={() => setItems([...items, { ph: '', pp: '' }])}>+ Ô</AddButton>
        </div>
      );
    case 'pinyin':
      return (
        <div className="pinyin-grid">
          <StringItems items={items} onChange={setItems} className="pinyin-chip" placeholder="pīnyīn" />
          <AddButton onClick={() => setItems([...items, ''])}>+ Ô</AddButton>
        </div>
      );
    case 'sentences':
      return (
        <div className="sentence-list">
          <label className="be-check">
            <input type="checkbox" checked={part.hanzi !== false} onChange={(e) => set({ hanzi: e.target.checked })} /> Hiển thị bằng phông chữ Hán
          </label>
          <StringItems
            items={items}
            onChange={setItems}
            className="sentence-item"
            render={(it, i) => (
              <>
                <span className="sentence-num">({i + 1})</span>
                <TextField className={part.hanzi === false ? '' : 'hanzi'} value={it} onChange={(v) => setItems(listOps.update(items, i, v))} placeholder="Câu hỏi / câu luyện" />
              </>
            )}
          />
          <AddButton onClick={() => setItems([...items, ''])}>+ Câu</AddButton>
        </div>
      );
    case 'reading':
      return (
        <>
          <label className="be-check">
            <input type="checkbox" checked={!!part.prose} onChange={(e) => set({ prose: e.target.checked })} /> Kiểu văn xuôi tiếng Việt (như tab Ngữ pháp)
          </label>
          <AreaField
            className={'reading-box' + (part.prose ? ' be-prose' : '')}
            value={part.html}
            onChange={(v) => set({ html: v })}
            placeholder="Đoạn văn — xuống dòng dùng <br/>"
            rows={3}
          />
        </>
      );
    case 'homework':
      return (
        <div className="homework-list">
          <StringItems items={items} onChange={setItems} className="homework-item" placeholder="✓ Nội dung bài tập" />
          <AddButton onClick={() => setItems([...items, '✓ '])}>+ Bài tập</AddButton>
        </div>
      );
    case 'toneQuiz':
      return (
        <>
          <div className="tone-quiz">
            {items.map((q, i) => (
              <div key={i} className="tone-question be-item">
                <TextField className="tone-word" value={q.word} onChange={(v) => setItems(listOps.patch(items, i, { word: v }))} placeholder="一天" />
                <div className="tone-options">
                  {q.options.map((opt, oi) => (
                    <span key={oi} className="be-tone-option">
                      <input
                        type="radio"
                        name={`${uid}-tq-${i}`}
                        checked={q.answer === oi}
                        onChange={() => setItems(listOps.patch(items, i, { answer: oi }))}
                        title="Đáp án đúng"
                      />
                      <TextField
                        value={opt}
                        onChange={(v) => setItems(listOps.patch(items, i, { options: listOps.update(q.options, oi, v) }))}
                        placeholder={`Lựa chọn ${oi + 1}`}
                      />
                    </span>
                  ))}
                  <button type="button" className="be-mini" onClick={() => setItems(listOps.patch(items, i, { options: [...q.options, ''] }))}>
                    +
                  </button>
                </div>
                <TextField className="tone-result" value={q.note} onChange={(v) => setItems(listOps.patch(items, i, { note: v }))} placeholder="Giải thích khi chọn đúng" />
                <ItemControls index={i} count={items.length} onRemove={(idx) => setItems(listOps.remove(items, idx))} />
              </div>
            ))}
          </div>
          <AddButton onClick={() => setItems([...items, { word: '', options: ['', '', ''], answer: 0, note: '' }])}>+ Câu hỏi</AddButton>
          <TextField value={part.wrongText} onChange={(v) => set({ wrongText: v })} placeholder="Thông báo khi chọn sai" className="be-wide" />
        </>
      );
    case 'extensions':
      return (
        <div className="extension-grid">
          {items.map((it, i) => (
            <div key={i} className="extension-chip be-item">
              <TextField className="eh" value={it.h} onChange={(v) => setItems(listOps.patch(items, i, { h: v }))} placeholder="汉字" />
              <TextField className="ep" value={it.p} onChange={(v) => setItems(listOps.patch(items, i, { p: v }))} placeholder="pinyin" />
              <TextField className="em" value={it.m} onChange={(v) => setItems(listOps.patch(items, i, { m: v }))} placeholder="nghĩa" />
              <ItemControls index={i} count={items.length} onRemove={(idx) => setItems(listOps.remove(items, idx))} />
            </div>
          ))}
          <AddButton onClick={() => setItems([...items, { h: '', p: '', m: '' }])}>+ Từ</AddButton>
        </div>
      );
    default:
      return <div className="be-hint">Loại nội dung "{part.type}" chỉ xem được, không sửa trong trình soạn.</div>;
  }
}

export function ExBlockEditor({ block, number, onChange, controls }) {
  const parts = block.parts || [];
  const setParts = (next) => onChange({ ...block, parts: next });
  return (
    <div className="ex-block be-block">
      <h3>
        <span className="ex-num">{number}</span>
        <TextField value={block.title} onChange={(v) => onChange({ ...block, title: v })} placeholder='Tiêu đề, VD: <span class="hanzi">词组朗读</span> — Đọc cụm từ' />
        {controls}
      </h3>
      <TextField className="ex-desc" value={block.desc} onChange={(v) => onChange({ ...block, desc: v })} placeholder="Mô tả ngắn (tuỳ chọn)" />
      {parts.map((part, i) => (
        <div key={i} className="be-part">
          <div className="be-part-head">
            <span>{PART_TYPES[part.type] || part.type}</span>
            <ItemControls index={i} count={parts.length} onMove={(a, b) => setParts(listOps.move(parts, a, b))} onRemove={(idx) => setParts(listOps.remove(parts, idx))} label="phần" />
          </div>
          <PartEditor part={part} onChange={(p) => setParts(listOps.update(parts, i, p))} />
        </div>
      ))}
      <AddMenu label="+ Thêm nội dung vào khối" options={PART_OPTIONS} onPick={(t) => setParts([...parts, emptyPart(t)])} />
    </div>
  );
}

export function ExBlockListEditor({ blocks, onChange, addLabel = '+ Thêm khối bài tập' }) {
  return (
    <>
      {blocks.map((b, i) => (
        <ExBlockEditor
          key={i}
          block={b}
          number={i + 1}
          onChange={(v) => onChange(listOps.update(blocks, i, v))}
          controls={
            <ItemControls index={i} count={blocks.length} onMove={(a, c) => onChange(listOps.move(blocks, a, c))} onRemove={(idx) => onChange(listOps.remove(blocks, idx))} label="khối" />
          }
        />
      ))}
      <AddButton className="be-add-block" onClick={() => onChange([...blocks, emptyBlock()])}>
        {addLabel}
      </AddButton>
    </>
  );
}
