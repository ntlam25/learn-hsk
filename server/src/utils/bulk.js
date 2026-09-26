// Đọc danh sách id cho các thao tác hàng loạt: body[key] là mảng chuỗi, bỏ trùng, tối đa `max` phần tử.
// Trả về mảng id, hoặc null khi không hợp lệ (controller trả 400).
const MAX_BULK = 500;

function idsFrom(body, key = 'ids', max = MAX_BULK) {
  const raw = body?.[key];
  if (!Array.isArray(raw)) return null;
  const ids = [...new Set(raw.filter((x) => typeof x === 'string' && x))];
  if (!ids.length || ids.length > max) return null;
  return ids;
}

const BAD_IDS = { message: `Danh sách chọn không hợp lệ (cần 1–${MAX_BULK} mục).` };

module.exports = { idsFrom, BAD_IDS };
