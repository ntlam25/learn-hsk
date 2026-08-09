import { useState } from 'react';
import TianziBox from './TianziBox';

function CharRow({ chars = [] }) {
  return (
    <div className="char-row">
      {chars.map((c, i) => (
        <div key={i} className="char-box-wrap">
          <TianziBox char={c.h} />
          {c.p ? <div className="char-pinyin">{c.p}</div> : null}
          {c.r ? (
            <span className="char-radical">
              {c.r} · {c.rm}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WordBody({ entry }) {
  return (
    <>
      <CharRow chars={entry.chars} />
      <div className="word-pinyin">{entry.pinyin}</div>
      {entry.pos ? <div className="pos">{entry.pos}</div> : null}
      <div className="meaning">{entry.meaning}</div>
      {entry.meaning_en ? <div className="meaning-en">{entry.meaning_en}</div> : null}
      {entry.note ? <div className="note-box">{entry.note}</div> : null}

      {entry.related?.length ? (
        <>
          <div className="sub-label">TỪ LIÊN QUAN</div>
          <div className="wordlist">
            {entry.related.map((w, i) => (
              <div key={i} className="wordlist-item">
                <span className="wh">{w[0]}</span>
                <span className="wp">{w[1]}</span>
                <span className="wm">{w[2]}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {entry.wordlist?.length ? (
        <>
          <div className="sub-label">TỪ MỞ RỘNG</div>
          <div className="wordlist">
            {entry.wordlist.map((w, i) => (
              <div key={i} className="wordlist-item">
                <span className="wh">{w.h}</span>
                <span className="wp">{w.p}</span>
                <span className="wm">{w.m}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {entry.examples?.length ? (
        <>
          <div className="sub-label">VÍ DỤ</div>
          <div className="example-list">
            {entry.examples.map((ex, i) => (
              <div key={i} className="example-line">
                <div className="example-hanzi">{ex[0]}</div>
                {ex[1] ? <div className="example-pinyin">{ex[1]}</div> : null}
                <div className="example-vi">{ex[2]}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {entry.sub ? (
        <div className="sub-entry">
          <div className="sub-label">TỪ GỐC</div>
          <WordBody entry={entry.sub} />
        </div>
      ) : null}
    </>
  );
}

export default function VocabCard({ entry, showNum }) {
  const [done, setDone] = useState(false);
  return (
    <div className={'vcard' + (done ? ' done' : '')}>
      <div className="vcard-top">
        <span className="vnum">{showNum && entry.num ? `Từ ${entry.num}` : ''}</span>
        <button className="check-btn" onClick={() => setDone((d) => !d)} title="Đánh dấu đã học">
          ✓
        </button>
      </div>
      <WordBody entry={entry} />
    </div>
  );
}
