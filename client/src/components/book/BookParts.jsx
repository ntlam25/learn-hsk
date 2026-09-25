import { useState } from 'react';
import sanitizeHtml from '../../lib/sanitizeHtml';
import { copyText } from '../../lib/clipboard';
import Html from './Html';
import CharRunner from './CharRunner';
import InlineStrokeToggle from './InlineStrokeToggle';
import {
  AUDIO_GROUP_TITLE,
  DEFAULT_TONE_WRONG_TEXT,
  DEFAULT_WORDLIST_LABEL,
  PROSE_READING_STYLE,
  TAB_META,
  audioIndex,
  audioMeta,
  avatarFor,
  defaultBookTitle,
  focusMarkup,
} from '../../lib/lessonContent';

// Tiêu đề có phần tử đứng đầu (số thứ tự / chữ lớn) + HTML tiêu đề: ghép thẳng vào h3 (không bọc thêm span)
// vì h3.ex-block là flex — mỗi nút con là một flex item riêng giống hệt file gốc.
function LeadTitle({ lead, leadClass, html }) {
  const leadHtml = lead != null && lead !== '' ? `<span class="${leadClass}">${sanitizeHtml(String(lead))}</span>` : '';
  return <h3 dangerouslySetInnerHTML={{ __html: leadHtml + sanitizeHtml(html) }} />;
}

// Toàn bộ markup dưới đây bám đúng DOM của "Giáo trình Hán ngữ Bài 1–15.html" (class, thứ tự, text cố định)
// để book.css hiển thị y hệt file gốc.

export function BookHero({ lesson }) {
  return (
    <header className="hero">
      <div className="seal">{lesson.seal}</div>
      <Html as="h1" html={lesson.titleZh} />
      <Html as="p" className="subtitle" html={lesson.titleVi} />
      {lesson.tag ? <Html className="lesson-tag" html={lesson.tag} /> : null}
    </header>
  );
}

export function BookTabs({ tabs, active, onSelect }) {
  return (
    <nav className="tabs">
      {tabs.map((key) => (
        <button key={key} className={key === active ? 'active' : ''} data-tab={key} onClick={() => onSelect(key)}>
          <span className="zh">{TAB_META[key].zh}</span>
          {TAB_META[key].label}
        </button>
      ))}
    </nav>
  );
}

export function SectionHead({ head, children }) {
  return (
    <div className="section-head">
      <Html as="h2" html={head.title} />
      {head.desc ? <Html as="p" html={head.desc} /> : null}
      {children}
    </div>
  );
}

export function SourceNote({ html }) {
  return html ? <Html as="div" className="book-source-note" html={html} /> : null;
}

export function VocabProgress({ done, total }) {
  return (
    <div className="progress-wrap">
      <span>Đã thuộc</span>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
      </div>
      <span className="integrated-progress-label">
        {done}/{total}
      </span>
    </div>
  );
}

export function AudioGroup({ category, tracks: allTracks }) {
  const tracks = (allTracks || []).filter((t) => t.audioUrl); // ô chưa tải file thì không hiện với học viên
  if (!tracks.length) return null;
  return (
    <div className="section-audio-group" data-audio-category={category}>
      <div className="section-audio-title">
        <span className="section-audio-badge">🔊</span>
        <div>
          <strong>{AUDIO_GROUP_TITLE[category] || 'File nghe'}</strong>
          <span>Nghe trực tiếp trước khi học nội dung bên dưới</span>
        </div>
      </div>
      <div className="embedded-audio-grid section-audio-grid">
        {tracks.map((t, i) => (
          <article key={t.id || i} className="embedded-audio-track">
            <div className="embedded-audio-track-head">
              <span aria-hidden="true" className="embedded-audio-icon">
                ♪
              </span>
              <div className="embedded-audio-meta">
                <Html as="strong" html={t.label} />
                <span>{audioMeta(t)}</span>
              </div>
              <span className="embedded-audio-index">{audioIndex(t, i)}</span>
            </div>
            <audio controls preload="none" data-embedded-track={t.code} src={t.audioUrl || undefined}>
              Trình duyệt của bạn không hỗ trợ phát âm thanh.
            </audio>
          </article>
        ))}
      </div>
    </div>
  );
}

function WordBody({ entry }) {
  return (
    <>
      <div className="char-row">
        {entry.chars.map((c, i) => (
          <div key={i} className="char-box">
            <CharRunner char={c.h} />
            {c.p ? <div className="char-pinyin">{c.p}</div> : null}
            {c.r ? (
              <span className="char-radical">
                {c.r}
                {c.rm ? ` · ${c.rm}` : ''}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <Html as="div" className="word-pinyin" html={entry.pinyin} />
      {entry.pos ? <Html as="div" className="pos" html={entry.pos} /> : null}
      <Html as="div" className="meaning" html={entry.meaning} />
      {entry.meaningEn ? <Html as="div" className="meaning-en" html={entry.meaningEn} /> : null}
      {entry.wordlist?.length ? (
        <div className="sub-entry">
          <div className="sub-label">{entry.wordlistLabel || DEFAULT_WORDLIST_LABEL}</div>
          <div className="wordlist">
            {entry.wordlist.map((w, i) => (
              <div key={i} className="wordlist-item">
                <Html className="wh" html={w.h} />
                <Html className="wp" html={w.p} />
                <Html className="wm" html={w.m} />
                <InlineStrokeToggle text={w.h} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {entry.sub ? (
        <div className="sub-entry">
          <div className="sub-label">Từ gốc</div>
          <WordBody entry={{ chars: [], ...entry.sub }} />
        </div>
      ) : null}
      {entry.note ? <Html as="div" className="note-box" html={entry.note} /> : null}
      {entry.examples?.length ? (
        <div className="example-list">
          {entry.examples.map((ex, i) => (
            <div key={i} className="example-line">
              <Html as="div" className="example-hanzi" html={ex[0]} />
              {ex[1] ? <Html as="div" className="example-pinyin" html={ex[1]} /> : null}
              <Html as="div" className="example-vi" html={ex[2]} />
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function VocabCard({ entry, done, onToggle, vocabKey }) {
  return (
    <div className={'vcard integrated-vcard book-aligned-card' + (done ? ' done' : '')} data-vocab-key={vocabKey}>
      <div className="vcard-top">
        <span className="vnum">{entry.num != null && entry.num !== '' ? `Từ ${entry.num}` : ''}</span>
        <button aria-label="Đánh dấu đã thuộc" className="check-btn" type="button" onClick={onToggle}>
          ✓
        </button>
      </div>
      <WordBody entry={entry} />
      {entry.chars.length > 1 ? <InlineStrokeToggle text={entry.chars.map((c) => c.h).join('')} /> : null}
    </div>
  );
}

export function GroupTitle({ zh, vi }) {
  return (
    <h3 className="group-title">
      {zh} <span className="vi">{vi}</span>
    </h3>
  );
}

export function ProperNounTable({ rows }) {
  return (
    <div className="book-proper-table">
      {rows.map((r, i) => (
        <div key={i} className="book-proper-row has-stroke">
          <Html className="hanzi" html={r.hanzi} />
          <Html html={r.pinyin} />
          <Html html={r.meaning} />
          <InlineStrokeToggle text={r.hanzi} />
        </div>
      ))}
    </div>
  );
}

// Dữ liệu cũ: bảng quốc gia / thẻ từ mở rộng (extra.countries, extra.extensions)
export function LegacyVocabExtras({ extra }) {
  return (
    <>
      {extra.countries?.length ? (
        <>
          <GroupTitle zh="国家" vi="Tên các nước" />
          <div className="country-table">
            {extra.countries.map((c, i) => (
              <div key={i} className="country-row has-stroke">
                <span className="ch">{c.h}</span>
                <span className="py">{c.p}</span>
                <span className="mn">{c.m}</span>
                <InlineStrokeToggle text={c.h} />
              </div>
            ))}
          </div>
        </>
      ) : null}
      {extra.extensions?.length ? (
        <>
          <GroupTitle zh="扩展词汇" vi="Từ mở rộng" />
          <div className="extension-grid">
            {extra.extensions.map((e, i) => (
              <div key={i} className="extension-chip">
                <div className="eh">{e[0]}</div>
                <div className="ep">{e[1]}</div>
                <div className="em">{e[2]}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

export function DialogueCard({ dialogue }) {
  let speakerIndex = 0;
  return (
    <div className="dialogue-card book-dialogue">
      {dialogue.title ? <Html as="div" className="dlg-title" html={dialogue.title} /> : null}
      {dialogue.context ? <Html as="div" className="book-context" html={dialogue.context} /> : null}
      {dialogue.lines.map((line, i) => {
        if (line.loc) return <Html key={i} as="div" className="location-divider" html={line.loc} />;
        if (line.gap) return <div key={i} className="dlg-gap" />;
        const avatar = avatarFor(line.role, speakerIndex++);
        return (
          <div key={i} className="dlg-line">
            <div className={['dlg-avatar', avatar.variant, avatar.long ? 'long-role' : ''].filter(Boolean).join(' ')}>{avatar.text}</div>
            <div>
              <div className="dlg-speaker">{line.role}</div>
              <Html as="div" className="dlg-text" html={focusMarkup(line.text)} />
              {line.py ? <Html as="div" className="dlg-pinyin" html={focusMarkup(line.py)} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PhoneticsHero({ hero }) {
  return (
    <div className="phonetics-hero">
      <LeadTitle lead={hero.big} leadClass="big-one" html={hero.title} />
      {hero.rules?.length ? (
        <div className="rule-grid">
          {hero.rules.map((r, i) => (
            <div key={i} className="rule-card">
              <Html as="strong" html={r.title} />
              <Html as="div" className="rule-form" html={r.form} />
              <Html as="div" html={r.desc} />
            </div>
          ))}
        </div>
      ) : null}
      {hero.note ? <Html as="div" className="phonetic-note" html={hero.note} /> : null}
    </div>
  );
}

export function MiniNotes({ notes }) {
  return (
    <div className="mini-note-grid">
      {notes.map((n, i) => (
        <div key={i} className="mini-note">
          <Html as="h4" html={n.title} />
          <Html as="div" html={n.content} />
        </div>
      ))}
    </div>
  );
}

function Toggle({ className, children }) {
  const [done, setDone] = useState(false);
  return (
    <div className={className + (done ? ' done' : '')} onClick={() => setDone((d) => !d)}>
      {children}
    </div>
  );
}

function ToneQuestion({ item, wrongText }) {
  const [picked, setPicked] = useState(null);
  const correct = picked === item.answer;
  return (
    <div className="tone-question">
      <Html as="div" className="tone-word" html={item.word} />
      <div className="tone-options">
        {item.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={picked === i ? (correct ? 'correct' : 'wrong') : undefined}
            onClick={() => setPicked(i)}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="tone-result">
        {picked == null
          ? ''
          : correct
            ? `✓ ${item.word} đọc là ${item.options[item.answer]}${item.note ? ` · ${item.note}` : ''}`
            : wrongText || DEFAULT_TONE_WRONG_TEXT}
      </div>
    </div>
  );
}

export function ExPart({ part }) {
  switch (part.type) {
    case 'subtitle':
      return <Html as="div" className="ex-subtitle" html={part.html} />;
    case 'chips':
      return (
        <div className="practice-grid">
          {(part.items || []).map((it, i) => (
            <Toggle key={i} className="practice-chip">
              <Html as="div" className="ph" html={it.ph} />
              {it.pp != null ? <Html as="div" className="pp" html={it.pp} /> : null}
            </Toggle>
          ))}
        </div>
      );
    case 'pinyin':
      return (
        <div className="pinyin-grid">
          {(part.items || []).map((it, i) => (
            <Toggle key={i} className="pinyin-chip">
              <Html html={it} />
            </Toggle>
          ))}
        </div>
      );
    case 'sentences':
      return (
        <div className="sentence-list">
          {(part.items || []).map((it, i) => (
            <Toggle key={i} className="sentence-item">
              <span className="sentence-num">({i + 1})</span>
              <Html className={part.hanzi === false ? undefined : 'hanzi'} html={it} />
            </Toggle>
          ))}
        </div>
      );
    case 'reading':
      return <Html as="div" className="reading-box" style={part.prose ? PROSE_READING_STYLE : undefined} html={part.html} />;
    case 'homework':
      return (
        <div className="homework-list">
          {(part.items || []).map((it, i) => (
            <Html key={i} as="div" className="homework-item" html={it} />
          ))}
        </div>
      );
    case 'toneQuiz':
      return (
        <div className="tone-quiz">
          {(part.items || []).map((it, i) => (
            <ToneQuestion key={i} item={it} wrongText={part.wrongText} />
          ))}
        </div>
      );
    case 'extensions':
      return (
        <div className="extension-grid">
          {(part.items || []).map((it, i) => (
            <div key={i} className="extension-chip">
              <Html as="div" className="eh" html={it.h} />
              <Html as="div" className="ep" html={it.p} />
              <Html as="div" className="em" html={it.m} />
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function ExBlock({ block, number }) {
  return (
    <div className="ex-block">
      <LeadTitle lead={number} leadClass="ex-num" html={block.title} />
      {block.desc ? <Html as="p" className="ex-desc" html={block.desc} /> : null}
      {(block.parts || []).map((part, i) => (
        <ExPart key={i} part={part} />
      ))}
    </div>
  );
}

export function GrammarBlock({ item, number }) {
  if (item.parts?.length) return <ExBlock block={{ title: item.title, parts: item.parts }} number={number} />;
  return (
    <div className="ex-block">
      <LeadTitle lead={number} leadClass="ex-num" html={item.title} />
      <Html as="div" className="reading-box" style={PROSE_READING_STYLE} html={item.content} />
    </div>
  );
}

function TextPage({ page }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    copyText(page.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <article className="exercise-text-page" data-book-page={page.pageNumber}>
      <div className="exercise-text-page-head">
        <div>
          <span className="exercise-text-page-label">{page.label || '练习'}</span>
          <strong>Trang {page.pageNumber}</strong>
        </div>
        <button
          aria-label={`Sao chép nội dung trang ${page.pageNumber}`}
          className={'copy-exercise-text' + (copied ? ' copied' : '')}
          type="button"
          onClick={handleCopy}
        >
          {copied ? 'Đã sao chép' : 'Sao chép'}
        </button>
      </div>
      <pre className="exercise-copyable-text" tabIndex={0}>
        {page.text}
      </pre>
    </article>
  );
}

function uploadedPages(lesson) {
  return (lesson.pages || []).filter((p) => p.imageUrl);
}

export function hasBookExercises(lesson) {
  return !!(lesson.exercises.textPages?.length || uploadedPages(lesson).length || lesson.sourcePdfUrl);
}

export function BookExercises({ lesson, onOpenPage }) {
  const { textPages = [], bookTitle, bookNote } = lesson.exercises;
  const pages = uploadedPages(lesson);
  return (
    <details className="book-exercises" open>
      <summary>{bookTitle || defaultBookTitle(lesson.lessonNumber, Math.max(textPages.length, pages.length))}</summary>
      <SourceNote html={bookNote} />
      {textPages.length ? (
        <div className="exercise-text-extract" data-exercise-lesson={lesson.lessonNumber}>
          <div className="exercise-text-intro">
            <span aria-hidden="true" className="exercise-text-intro-icon">
              文
            </span>
            <div>
              <strong>Nội dung luyện tập dạng văn bản</strong>
              <span>
                Có thể bôi đen, sao chép và dùng trực tiếp trên lớp. Với bảng phiên âm, dấu thanh hoặc ký hiệu nhỏ, trang sách gốc
                được giữ ở phía dưới để đối chiếu.
              </span>
            </div>
          </div>
          <div className="exercise-text-pages">
            {textPages.map((p, i) => (
              <TextPage key={i} page={p} />
            ))}
          </div>
        </div>
      ) : null}
      {pages.length || lesson.sourcePdfUrl ? (
        <>
          <div className="original-page-divider">Trang sách gốc</div>
          {lesson.sourcePdfUrl ? (
            <a className="pdf-view-hint book-pdf-link" href={lesson.sourcePdfUrl} target="_blank" rel="noreferrer">
              📄 Mở / tải file PDF trang sách gốc
            </a>
          ) : null}
        </>
      ) : null}
      {pages.length ? (
        <>
          <details className="original-pages-toggle" open>
            <summary>🖼 Xem trang sách gốc</summary>
            <div className="pdf-view-hint">🔍 Ảnh đã được phóng lớn. Bấm trực tiếp vào ảnh để xem toàn màn hình.</div>
            <div className="book-page-grid">
              {pages.map((p, i) => {
                const caption = p.caption || `Trang bài tập trong PDF: ${p.pageNumber}`;
                return (
                  <figure key={p.id || i} className="book-page-card">
                    <img
                      alt={`Bài tập sách - PDF trang ${p.pageNumber}`}
                      loading="lazy"
                      src={p.imageUrl}
                      title="Bấm để xem toàn màn hình"
                      onClick={() => onOpenPage?.({ src: p.imageUrl, alt: `Bài tập sách - PDF trang ${p.pageNumber}`, caption })}
                    />
                    <figcaption>{caption}</figcaption>
                  </figure>
                );
              })}
            </div>
          </details>
        </>
      ) : null}
    </details>
  );
}

export function BookFooter({ footer }) {
  return (
    <footer>
      <span className="zh">{footer.zh}</span> <Html html={footer.text} />
    </footer>
  );
}
