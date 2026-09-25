"""
Chuyển "Giáo trình Hán ngữ Bài 1–15.html" thành dữ liệu bài học của hệ thống.

Đầu ra: server/src/seed/lesson{N}.json — nội dung bài học theo đúng cấu trúc hiển thị của file gốc.
File nghe / ảnh trang sách / PDF KHÔNG được tách ra: JSON chỉ giữ "ô" (tên, mã file, số trang, chú thích)
để giáo viên tải file lên qua trình soạn bài.

Cách chạy (cần Python 3 + beautifulsoup4):
  pip install beautifulsoup4
  python server/scripts/import_book.py "Giáo trình Hán ngữ Bài 1–15.html"
"""
import json
import re
import sys
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

ROOT = Path(__file__).resolve().parents[2]
SEED_DIR = ROOT / 'server' / 'src' / 'seed'

TAB_KEY_BY_ZH = {'生词': 'vocab', '课文': 'dialogue', '语音': 'phonetics', '语法': 'grammar', '练习': 'exercise'}
AUDIO_CATEGORY_BY_TAB = {'vocab': 'vocab', 'dialogue': 'text', 'phonetics': 'phonetics', 'exercise': 'practice'}
DATA_URI = re.compile(r'data:([a-z]+/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)')
warnings = []


def warn(msg):
    warnings.append(msg)
    print('  [cảnh báo]', msg)


def inner(el):
    """Nội dung HTML bên trong (giữ thẻ inline như <b>, <span class="tone-y2">…), gọn khoảng trắng."""
    if el is None:
        return ''
    html = el.decode_contents()
    html = re.sub(r'\s*\n\s*', ' ', html)
    return html.strip()


def text(el):
    return el.get_text(strip=True) if el is not None else ''


def classes(el):
    return el.get('class', []) if isinstance(el, Tag) else []


def flatten(children):
    """Bỏ lớp <div> không class (vd. #b7PhoneticsWrap) để lấy thẳng các khối bên trong."""
    out = []
    for c in children:
        if not isinstance(c, Tag):
            continue
        if c.name == 'div' and not c.get('class') and 'legacy-dummy' not in classes(c):
            out.extend(flatten(c.find_all(recursive=False)))
        else:
            out.append(c)
    return [c for c in out if 'legacy-dummy' not in classes(c)]


def h3_title(h3):
    """Tiêu đề ex-block: bỏ span.ex-num (số thứ tự được tính lại khi hiển thị)."""
    h3 = BeautifulSoup(str(h3), 'html.parser').h3
    num = h3.select_one('.ex-num')
    number = text(num)
    if num:
        num.decompose()
    return inner(h3), number


# ---------------------------------------------------------------- blocks
def parse_section_head(head):
    if head is None:
        return None
    return {
        'title': inner(head.h2),
        'desc': inner(head.p) if head.p else '',
        'note': inner(head.select_one('.book-source-note')),
    }


def parse_audio_group(group, category):
    """Chỉ lấy "ô" file nghe (tên + mã file); file thật được tải lên qua trình soạn bài."""
    tracks = []
    for art in group.select('.embedded-audio-track'):
        audio_el = art.find('audio')
        meta = text(art.select_one('.embedded-audio-meta span'))
        cm = re.search(r'Mã ([\w-]+)', meta)
        tracks.append({
            'category': category,
            'label': inner(art.select_one('.embedded-audio-meta strong')),
            'code': (audio_el.get('data-embedded-track', '') if audio_el else '') or (cm.group(1) if cm else ''),
            'audioUrl': '',
        })
    return tracks


def parse_vocab_card(card):
    entry = {}
    m = re.search(r'\d+', text(card.select_one('.vnum')))
    entry['num'] = int(m.group()) if m else None
    chars = []
    for box in card.select('.char-row > .char-box'):
        tz = box.select_one('.tianzige')
        c = {'h': tz.get('data-hanzi') or text(tz)}
        cp = box.select_one('.char-pinyin')
        if cp:
            c['p'] = text(cp)
        chars.append(c)
    entry['chars'] = chars
    entry['pinyin'] = inner(card.select_one('.word-pinyin'))
    entry['pos'] = inner(card.select_one('.pos'))
    entry['meaning'] = inner(card.select_one('.meaning'))
    if card.select_one('.meaning-en'):
        entry['meaningEn'] = inner(card.select_one('.meaning-en'))
    sub = card.select_one(':scope > .sub-entry')
    if sub:
        entry['wordlistLabel'] = text(sub.select_one('.sub-label'))
        entry['wordlist'] = [
            {'h': inner(i.select_one('.wh')), 'p': inner(i.select_one('.wp')), 'm': inner(i.select_one('.wm'))}
            for i in sub.select('.wordlist-item')
        ]
    note = card.select_one(':scope > .note-box')
    if note:
        entry['note'] = inner(note)
    examples = []
    for line in card.select('.example-list > .example-line'):
        examples.append([
            inner(line.select_one('.example-hanzi')),
            inner(line.select_one('.example-pinyin')),
            inner(line.select_one('.example-vi')),
        ])
    if examples:
        entry['examples'] = examples
    return entry


def parse_dialogue(card, lesson_no):
    d = {'title': inner(card.select_one('.dlg-title')), 'context': inner(card.select_one('.book-context')), 'lines': []}
    idx = 0
    for child in card.find_all(recursive=False):
        cls = classes(child)
        if 'dlg-line' in cls:
            avatar = child.select_one('.dlg-avatar')
            speaker = text(child.select_one('.dlg-speaker')) or text(avatar)
            line = {'role': speaker, 'text': inner(child.select_one('.dlg-text'))}
            py = child.select_one('.dlg-pinyin')
            if py:
                line['py'] = inner(py)
            # Kiểm tra quy tắc hiển thị: avatar = 2 ký tự đầu, màu xoay vòng A/B/C theo thứ tự dòng
            expect_cls = ['', 'B', 'C'][idx % 3]
            got_cls = next((c for c in classes(avatar) if c in ('B', 'C')), '')
            if text(avatar) != speaker[:2] or got_cls != expect_cls or (('long-role' in classes(avatar)) != (len(speaker) > 2)):
                warn(f'Bài {lesson_no}: avatar hội thoại khác quy tắc ({text(avatar)}/{speaker}/{classes(avatar)})')
            d['lines'].append(line)
            idx += 1
        elif 'location-divider' in cls:
            d['lines'].append({'loc': inner(child)})
        elif 'dlg-gap' in cls:
            d['lines'].append({'gap': True})
    return d


def parse_ex_block(block, tone_answers, lesson_no, expected_num):
    h3 = block.find('h3', recursive=False)
    title, number = h3_title(h3) if h3 else ('', '')
    if number and number != str(expected_num):
        warn(f'Bài {lesson_no}: ex-block đánh số {number}, dự kiến {expected_num}')
    ex = {'title': title, 'desc': inner(block.select_one(':scope > .ex-desc')), 'parts': []}
    for child in block.find_all(recursive=False):
        cls = classes(child)
        if child.name == 'h3' or 'ex-desc' in cls:
            continue
        if 'ex-subtitle' in cls:
            ex['parts'].append({'type': 'subtitle', 'html': inner(child)})
        elif 'practice-grid' in cls:
            items = []
            for chip in child.select('.practice-chip'):
                item = {'ph': inner(chip.select_one('.ph'))}
                pp = chip.select_one('.pp')
                if pp is not None:
                    item['pp'] = inner(pp)
                items.append(item)
            ex['parts'].append({'type': 'chips', 'items': items})
        elif 'pinyin-grid' in cls:
            ex['parts'].append({'type': 'pinyin', 'items': [inner(c) for c in child.select('.pinyin-chip')]})
        elif 'sentence-list' in cls:
            items = []
            hanzi = True
            for i, s in enumerate(child.select('.sentence-item'), 1):
                spans = s.find_all('span', recursive=False)
                body = spans[-1]
                hanzi = hanzi and 'hanzi' in classes(body)
                if text(spans[0]) != f'({i})':
                    warn(f'Bài {lesson_no}: sentence-num {text(spans[0])} khác ({i})')
                items.append(inner(body))
            ex['parts'].append({'type': 'sentences', 'hanzi': hanzi, 'items': items})
        elif 'reading-box' in cls:
            ex['parts'].append({'type': 'reading', 'prose': bool(child.get('style')), 'html': inner(child)})
        elif 'homework-list' in cls:
            ex['parts'].append({'type': 'homework', 'items': [inner(h) for h in child.select('.homework-item')]})
        elif 'extension-grid' in cls:
            ex['parts'].append({'type': 'extensions', 'items': [
                {'h': inner(c.select_one('.eh')), 'p': inner(c.select_one('.ep')), 'm': inner(c.select_one('.em'))}
                for c in child.select('.extension-chip')
            ]})
        elif 'tone-quiz' in cls:
            items = []
            for q in child.select('.tone-question'):
                word = text(q.select_one('.tone-word'))
                options = [text(b) for b in q.select('.tone-options button')]
                tones = [b.get('data-tone') for b in q.select('.tone-options button')]
                ans = tone_answers.get(word)
                if not ans:
                    warn(f'Bài {lesson_no}: không có đáp án quiz cho "{word}"')
                    items.append({'word': word, 'options': options, 'answer': 0, 'note': ''})
                    continue
                items.append({'word': word, 'options': options, 'answer': tones.index(ans[0]), 'note': ans[1]})
            ex['parts'].append({
                'type': 'toneQuiz',
                'wrongText': 'Chưa đúng — hãy nhận dạng thanh điệu của âm tiết đứng sau 一.',
                'items': items,
            })
        else:
            warn(f'Bài {lesson_no}: phần ex-block chưa hỗ trợ {child.name}.{".".join(cls)} → giữ nguyên HTML')
            ex['parts'].append({'type': 'html', 'html': str(child)})
    return ex


def parse_phonetics_hero(hero):
    h3 = BeautifulSoup(str(hero.h3), 'html.parser').h3
    big = h3.select_one('.big-one')
    big_char = text(big)
    big.decompose()
    return {
        'big': big_char,
        'title': inner(h3),
        'rules': [
            {'title': inner(r.strong), 'form': inner(r.select_one('.rule-form')), 'desc': inner(r.find_all('div', recursive=False)[-1])}
            for r in hero.select('.rule-card')
        ],
        'note': inner(hero.select_one('.phonetic-note')),
    }


def tone_answers_from_scripts(raw_html):
    """Đáp án quiz biến điệu 一 chỉ có trong JS gốc (mảng toneItems), không có trong DOM đã lưu."""
    m = re.search(r'const toneItems=\[(.*?)\];', raw_html, re.S)
    if not m:
        return {}
    out = {}
    for word, _rest, tone, note in re.findall(r"\['([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\]", m.group(1)):
        out[word] = (tone, note)
    return out


# ---------------------------------------------------------------- lesson
def parse_lesson(app, tone_answers):
    n = int(re.search(r'\d+', app['id']).group())
    print(f'Bài {n}…')
    hero = app.select_one('header.hero')
    lesson = {
        'lessonNumber': n,
        'seal': text(hero.select_one('.seal')),
        'titleZh': inner(hero.h1),
        'titleVi': inner(hero.select_one('.subtitle')),
        'tag': inner(hero.select_one('.lesson-tag')),
        'published': True,
        'vocab': [],
        'properNouns': [],
        'dialogues': [],
        'phoneticsNotes': [],
        'grammar': [],
        'exercises': {},
        'extra': {'tabs': [], 'heads': {}},
        'audioTracks': [],
        'pages': [],
    }
    extra = lesson['extra']
    tab_by_panel = {}
    for b in app.select('nav.tabs button'):
        key = TAB_KEY_BY_ZH[text(b.select_one('.zh'))]
        tab_by_panel[b['data-tab']] = key
        extra['tabs'].append(key)

    for sec in app.select('main > section.panel'):
        key = tab_by_panel[sec['id']]
        blocks = flatten(sec.find_all(recursive=False))
        ex_count = 0
        after_teacher = key != 'exercise'
        for el in blocks:
            cls = classes(el)
            if 'section-head' in cls:
                extra['heads'][key] = parse_section_head(el)
            elif 'section-audio-group' in cls:
                lesson['audioTracks'] += parse_audio_group(el, AUDIO_CATEGORY_BY_TAB[key])
            elif 'book-source-note' in cls:
                extra['heads'].setdefault(key, {})['note'] = inner(el)
            elif 'book-vocab-grid' in cls or 'vocab-grid' in cls:
                lesson['vocab'] = [parse_vocab_card(c) for c in el.select(':scope > .vcard')]
            elif el.name == 'h3' and 'group-title' in cls:
                vi = el.select_one('.vi')
                extra['properNounsTitle'] = {'zh': el.find(string=True, recursive=False).strip(), 'vi': text(vi)}
            elif 'book-proper-table' in cls:
                lesson['properNouns'] = [
                    {'hanzi': inner(spans[0]), 'pinyin': inner(spans[1]), 'meaning': inner(spans[2])}
                    for spans in (r.find_all('span', recursive=False) for r in el.select('.book-proper-row'))
                ]
            elif 'dialogue-card' in cls:
                lesson['dialogues'].append(parse_dialogue(el, n))
            elif 'phonetics-hero' in cls:
                extra['phoneticsHero'] = parse_phonetics_hero(el)
            elif 'mini-note-grid' in cls:
                lesson['phoneticsNotes'] = [{'title': inner(m.h4), 'content': inner(m.find('div'))} for m in el.select('.mini-note')]
            elif 'ex-block' in cls:
                ex_count += 1
                block = parse_ex_block(el, tone_answers, n, ex_count)
                if key == 'grammar':
                    parts = block['parts']
                    if len(parts) == 1 and parts[0]['type'] == 'reading' and parts[0]['prose'] and not block['desc']:
                        lesson['grammar'].append({'title': block['title'], 'content': parts[0]['html']})
                    else:
                        warn(f'Bài {n}: khối ngữ pháp không theo mẫu tiêu đề + reading-box')
                        lesson['grammar'].append({'title': block['title'], 'content': '', 'parts': parts})
                elif key == 'phonetics':
                    extra.setdefault('phoneticsBlocks', []).append(block)
                elif key == 'exercise':
                    lesson['exercises'].setdefault('blocks', []).append(block)
                else:
                    warn(f'Bài {n}: ex-block trong tab {key} chưa được hỗ trợ')
            elif el.name == 'details' and 'book-exercises' in cls:
                ex = lesson['exercises']
                ex['bookTitle'] = text(el.summary)
                ex['bookNote'] = inner(el.select_one(':scope > .book-source-note'))
                ex['textPages'] = [
                    {
                        'pageNumber': int(p.get('data-book-page')),
                        'label': text(p.select_one('.exercise-text-page-label')),
                        'text': p.select_one('.exercise-copyable-text').get_text(),
                    }
                    for p in el.select('.exercise-text-page')
                ]
                for fig in el.select('.book-page-card'):
                    img = fig.find('img')
                    pm = re.search(r'(\d+)$', img.get('alt', ''))
                    page_no = int(pm.group(1))
                    lesson['pages'].append({'pageNumber': page_no, 'caption': text(fig.figcaption), 'imageUrl': ''})
            elif 'teacher-extra-divider' in cls:
                extra['teacherDivider'] = inner(el)
                after_teacher = True
            else:
                warn(f'Bài {n}: bỏ qua khối {el.name}.{".".join(cls)} trong tab {key}')
    foot = app.find('footer', recursive=False)
    if foot:
        zh = foot.select_one('.zh')
        rest = BeautifulSoup(str(foot), 'html.parser').footer
        rest.select_one('.zh').decompose()
        extra['footer'] = {'zh': text(zh), 'text': inner(rest)}
    return lesson


def main():
    src = Path(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'Giáo trình Hán ngữ Bài 1–15.html')
    raw = src.read_text(encoding='utf-8')
    print(f'Đọc {src.name} ({len(raw) / 1e6:.0f} MB)…')
    tone_answers = tone_answers_from_scripts(raw)
    light = DATA_URI.sub('DATA', raw)
    soup = BeautifulSoup(light, 'html.parser')
    apps = sorted(soup.select('div.lesson-app'), key=lambda a: int(re.search(r'\d+', a['id']).group()))
    for app in apps:
        lesson = parse_lesson(app, tone_answers)
        out = SEED_DIR / f"lesson{lesson['lessonNumber']}.json"
        out.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Xong: {len(apps)} bài → {SEED_DIR}')
    if warnings:
        print(f'{len(warnings)} cảnh báo (xem ở trên).')


if __name__ == '__main__':
    main()
