import StringListEditor from './StringListEditor';

function PhoneticsGroupsEditor({ groups, onChange }) {
  function update(i, field, val) {
    onChange(groups.map((g, idx) => (idx === i ? { ...g, [field]: val } : g)));
  }
  function add() {
    onChange([...groups, { subtitle: '', items: [] }]);
  }
  function remove(i) {
    onChange(groups.filter((_, idx) => idx !== i));
  }

  return (
    <div className="phonetics-groups-editor">
      {groups.map((g, i) => (
        <div key={i} className="vocab-entry-editor">
          <div className="vocab-entry-editor-head">
            <input placeholder="Tiêu đề nhóm" value={g.subtitle || ''} onChange={(e) => update(i, 'subtitle', e.target.value)} />
            <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá nhóm">
              Xoá
            </button>
          </div>
          <StringListEditor items={g.items || []} onChange={(v) => update(i, 'items', v)} addLabel="+ Thêm âm tiết" placeholder="VD: dàxué" />
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm nhóm luyện âm
      </button>
    </div>
  );
}

// items của chips luôn chuẩn hoá về dạng [hán, phụ đề] (đọc cả string cũ lẫn tuple).
function normalizeChipItems(items) {
  return (items || []).map((it) => (Array.isArray(it) ? it : [it, '']));
}

function ChipItemsEditor({ items, onChange }) {
  function update(i, idx2, val) {
    onChange(
      items.map((it, i2) => {
        if (i2 !== i) return it;
        const copy = [...it];
        copy[idx2] = val;
        return copy;
      })
    );
  }
  function add() {
    onChange([...items, ['', '']]);
  }
  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="examples-editor">
      {items.map((it, i) => (
        <div key={i} className="chip-items-editor-row">
          <input placeholder="汉字" value={it[0] || ''} onChange={(e) => update(i, 0, e.target.value)} />
          <input placeholder="Pinyin / phụ đề" value={it[1] || ''} onChange={(e) => update(i, 1, e.target.value)} />
          <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá">
            ×
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm chip
      </button>
    </div>
  );
}

function ChipGroupsEditor({ groups, onChange }) {
  function update(i, field, val) {
    onChange(groups.map((g, idx) => (idx === i ? { ...g, [field]: val } : g)));
  }
  function add() {
    onChange([...groups, { title: '', desc: '', items: [] }]);
  }
  function remove(i) {
    onChange(groups.filter((_, idx) => idx !== i));
  }

  return (
    <div className="chip-groups-editor">
      {groups.map((g, i) => (
        <div key={i} className="vocab-entry-editor">
          <div className="vocab-entry-editor-head">
            <input placeholder="Tiêu đề" value={g.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
            <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá nhóm">
              Xoá
            </button>
          </div>
          <textarea placeholder="Mô tả" value={g.desc || ''} onChange={(e) => update(i, 'desc', e.target.value)} />
          <ChipItemsEditor items={normalizeChipItems(g.items)} onChange={(v) => update(i, 'items', v)} />
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm nhóm luyện tập
      </button>
    </div>
  );
}

function TextPagesEditor({ pages, onChange }) {
  function update(i, field, val) {
    onChange(pages.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));
  }
  function add() {
    onChange([...pages, { pageNumber: '', text: '' }]);
  }
  function remove(i) {
    onChange(pages.filter((_, idx) => idx !== i));
  }

  return (
    <div className="text-pages-editor">
      {pages.map((p, i) => (
        <div key={i} className="vocab-entry-editor">
          <div className="vocab-entry-editor-head">
            <input
              className="entry-num-input"
              type="number"
              placeholder="Trang #"
              value={p.pageNumber}
              onChange={(e) => update(i, 'pageNumber', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <button type="button" className="btn-icon-danger" onClick={() => remove(i)} title="Xoá trang">
              Xoá
            </button>
          </div>
          <textarea rows={6} placeholder="Nội dung trang (gõ lại từ sách)" value={p.text || ''} onChange={(e) => update(i, 'text', e.target.value)} />
        </div>
      ))}
      <button type="button" className="btn-ghost-sm" onClick={add}>
        + Thêm trang trích văn bản
      </button>
    </div>
  );
}

export default function ExercisesEditor({ exercises, onChange }) {
  const { phonetics = [], chips = [], questions = [], reading = '', homework = [], textPages = [] } = exercises || {};

  function set(field, val) {
    onChange({ ...exercises, [field]: val });
  }

  return (
    <div className="exercises-editor">
      <div className="sub-label">LUYỆN ÂM/THANH ĐIỆU</div>
      <PhoneticsGroupsEditor groups={phonetics} onChange={(v) => set('phonetics', v)} />

      <div className="sub-label">NHÓM LUYỆN TẬP (CHIP)</div>
      <ChipGroupsEditor groups={chips} onChange={(v) => set('chips', v)} />

      <div className="sub-label">CÂU HỎI</div>
      <StringListEditor items={questions} onChange={(v) => set('questions', v)} addLabel="+ Thêm câu hỏi" placeholder="Câu hỏi" />

      <div className="sub-label">ĐOẠN VĂN ĐỌC HIỂU</div>
      <textarea rows={5} placeholder="Đoạn văn" value={reading} onChange={(e) => set('reading', e.target.value)} />

      <div className="sub-label">BÀI TẬP VỀ NHÀ</div>
      <StringListEditor items={homework} onChange={(v) => set('homework', v)} addLabel="+ Thêm bài tập" placeholder="Nội dung bài tập" />

      <div className="sub-label">TRÍCH VĂN BẢN BÀI TẬP (kèm nút Sao chép)</div>
      <TextPagesEditor pages={textPages} onChange={(v) => set('textPages', v)} />
    </div>
  );
}
