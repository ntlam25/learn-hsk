// =====================================================================
//  Nội dung trang sinh nhật.
//  Nội dung thật sửa ở trang quản trị  /admin/birthday  (lưu trong bảng birthday_pages).
//  Dưới đây chỉ là nội dung MẶC ĐỊNH, dùng khi DB chưa có / không tải được.
// =====================================================================

export const SLUG = 'mai';

export const MAX_TREE_WISHES = 6; // cây có 10 chỗ treo → chừa ít nhất 4 chỗ cho điều ước của người được chúc

export const DEFAULT_CONTENT = {
  name: 'Mai',
  birthDate: '2003-11-10', // YYYY-MM-DD
  sender: 'Lâm',
  // Lời chúc rơi ra khi nổ bóng; bóng thứ i mang chữ cái thứ i của tên
  balloonWishes: ['Mạnh khoẻ, ngày càng xinh 💪', 'An yên, hạnh phúc ngập tràn 💗', 'Ít deadline, nhiều lương 💸'],
  // { src, cap, memo } — src là URL ảnh trên Supabase Storage; để trống danh sách thì hiện ô màu thay thế
  photos: [],
  treeWishes: [
    'Luôn khoẻ mạnh, xinh đẹp 💪',
    'Cười thật nhiều mỗi ngày 😄',
    'Gặp toàn người tốt, chuyện vui 🍀',
    'Mọi dự định đều thành công 🎯',
  ],
  // {age} sẽ được thay bằng số tuổi
  letter: `Mai thân mến,

Chúc mừng sinh nhật tuổi {age}! 🎂

Tuổi mới, chúc Mai luôn mạnh khoẻ, xinh đẹp và tràn đầy năng lượng. Chúc Mai công việc suôn sẻ, đi đâu cũng gặp người tốt, làm gì cũng thuận buồm xuôi gió.

Chúc Mai một năm thật nhiều niềm vui, nhiều may mắn, và mọi điều ước hôm nay đều thành sự thật.

Sinh nhật thật vui nha!`,
  signature: 'Lâm',
};

export const COLORS = ['#F2789F', '#FFCF5C', '#8FD3BF', '#9CC9F5', '#C3A6F0', '#FFB59E', '#E0527F'];

// Ô màu + emoji thay cho ảnh khi chưa có ảnh / ảnh lỗi
const PLACEHOLDERS = [
  { emo: '🌸', bg: ['#FFD3A5', '#FD6585'] },
  { emo: '🧋', bg: ['#C2FFD8', '#465EFB'] },
  { emo: '✨', bg: ['#FFF6B7', '#F6416C'] },
  { emo: '🌿', bg: ['#ABDCFF', '#0396FF'] },
  { emo: '🎂', bg: ['#FEB692', '#EA5455'] },
  { emo: '💗', bg: ['#E2B0FF', '#9F44D3'] },
];

const str = (v, fallback) => (typeof v === 'string' && v.trim() ? v : fallback);
const strList = (v, fallback) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : fallback);

/** Gộp nội dung từ DB với mặc định, lọc kiểu dữ liệu sai. Dùng chung cho trang và trang quản trị. */
export function normalizeContent(raw) {
  const c = raw && typeof raw === 'object' ? raw : {};
  const d = DEFAULT_CONTENT;
  return {
    name: str(c.name, d.name).trim(),
    birthDate: /^\d{4}-\d{2}-\d{2}$/.test(c.birthDate || '') ? c.birthDate : d.birthDate,
    sender: str(c.sender, d.sender).trim(),
    balloonWishes: strList(c.balloonWishes, d.balloonWishes),
    photos: Array.isArray(c.photos)
      ? c.photos
          .filter((p) => p && typeof p === 'object')
          .map((p) => ({ src: str(p.src, ''), cap: str(p.cap, ''), memo: str(p.memo, '') }))
      : d.photos,
    treeWishes: strList(c.treeWishes, d.treeWishes).filter((s) => s.trim()).slice(0, MAX_TREE_WISHES),
    letter: str(c.letter, d.letter),
    signature: typeof c.signature === 'string' ? c.signature : d.signature,
  };
}

/** Các chữ cái trên bóng bay: tên viết hoa, bỏ khoảng trắng, tối đa 10 chữ. */
export const nameLetters = (name) => Array.from(name.replace(/\s+/g, '').toLocaleUpperCase('vi')).slice(0, 10);

// Đối tượng "sống" các màn đọc khi render; applyContent() ghi đè trước khi trang hiện ra
export const BDAY = {};

export function applyContent(raw) {
  const c = normalizeContent(raw);
  const [y, m, d] = c.birthDate.split('-').map(Number);
  const photos = c.photos.length
    ? c.photos.map((p, i) => ({ ...PLACEHOLDERS[i % PLACEHOLDERS.length], ...p }))
    : PLACEHOLDERS.map((ph) => ({ src: '', cap: '', memo: '', ...ph }));
  Object.assign(BDAY, {
    name: c.name,
    sender: c.sender,
    birth: { y, m, d },
    balloons: nameLetters(c.name).map((ch, i) => [ch, str(c.balloonWishes[i], 'Sinh nhật thật vui nha 🎉')]),
    photos,
    treeWishes: c.treeWishes,
    letter: c.letter,
    signature: c.signature,
  });
}

applyContent(DEFAULT_CONTENT);
