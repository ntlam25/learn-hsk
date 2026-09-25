require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const courseModel = require('../models/courseModel');
const lessonModel = require('../models/lessonModel');

// Cách dùng:
//   npm run seed              — tạo admin, khoá học và các bài còn thiếu
//   npm run seed -- --update  — ghi đè NỘI DUNG CHỮ các bài đã có bằng dữ liệu giáo trình mới nhất
//
// Dữ liệu lesson{n}.json được sinh từ "Giáo trình Hán ngữ Bài 1–15.html" bằng
// server/scripts/import_book.py. Seed không tải file: file nghe, ảnh trang sách và PDF do giáo viên
// tải lên qua trình soạn bài. Bài mới được tạo sẵn các "ô" file (tên, mã, số trang) còn trống;
// với --update, file nghe/ảnh đã tải lên được giữ nguyên.
const UPDATE_EXISTING = process.argv.includes('--update');
function loadLessonFiles() {
  return fs
    .readdirSync(__dirname)
    .filter((f) => /^lesson\d+\.json$/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf-8')))
    .sort((a, b) => a.lessonNumber - b.lessonNumber);
}

// Dữ liệu kiểu cũ (exercises = { notes, grammar, chips, … }) → tách notes/grammar ra cột riêng.
function fromLegacyShape(data) {
  const { notes, grammar, ...restExercises } = data.exercises || {};
  return { ...data, phoneticsNotes: notes || [], grammar: grammar || [], exercises: restExercises };
}

function toPayload(data, courseId, { keepFiles }) {
  const payload = { ...(data.extra?.tabs ? data : fromLegacyShape(data)), courseId, isPreview: data.lessonNumber === 1 };
  if (keepFiles) {
    delete payload.audioTracks; // không gửi → server giữ nguyên file nghe / ảnh trang đã tải
    delete payload.pages;
  }
  return payload;
}

async function ensureAdmin() {
  const username = (process.env.SEED_ADMIN_USERNAME || 'admin').toLowerCase();
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@hanzi-course.local').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  let admin = await userModel.findByUsername(username);
  if (!admin) {
    const passwordHash = await bcrypt.hash(password, 10);
    admin = await userModel.create({ username, email, passwordHash, fullName: 'Quản trị viên', role: 'admin' });
    console.log(`[seed] Đã tạo tài khoản admin "${username}"`);
  } else {
    console.log(`[seed] Tài khoản admin "${username}" đã tồn tại, bỏ qua.`);
  }
  return admin;
}

async function ensureCourse(admin) {
  const courses = await courseModel.listAdmin();
  let course = courses.find((c) => c.title === 'Hán ngữ cơ sở (Bài 1–15)');
  if (!course) {
    course = await courseModel.create({
      title: 'Hán ngữ cơ sở (Bài 1–15)',
      description: 'Chuyển thể từ giáo trình Hán ngữ Bài 1–15 gốc.',
      hskLevel: 'HSK1',
      createdBy: admin.id,
      published: true,
    });
    console.log(`[seed] Đã tạo khoá học "${course.title}".`);
  } else {
    console.log(`[seed] Khoá học "${course.title}" đã tồn tại, bỏ qua.`);
  }
  return course;
}

async function run() {
  const admin = await ensureAdmin();
  const course = await ensureCourse(admin);

  const lessons = loadLessonFiles();
  console.log(`[seed] Tìm thấy ${lessons.length} file bài học để seed vào khoá "${course.title}".`);

  for (const data of lessons) {
    const exists = await lessonModel.findByNumber(course.id, data.lessonNumber);
    if (exists && !UPDATE_EXISTING) {
      console.log(`[seed] Bài ${data.lessonNumber} đã tồn tại, bỏ qua (thêm --update để ghi đè nội dung).`);
      continue;
    }
    const payload = toPayload(data, course.id, { keepFiles: !!exists });
    if (exists) {
      await lessonModel.update(exists.id, payload);
      console.log(`[seed] Đã cập nhật Bài ${data.lessonNumber} (${data.titleVi}).`);
    } else {
      await lessonModel.create({ ...payload, createdBy: admin.id });
      console.log(`[seed] Đã tạo Bài ${data.lessonNumber} (${data.titleVi}).`);
    }
  }

  console.log('[seed] Hoàn tất.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Lỗi:', err.message || err);
  process.exit(1);
});
