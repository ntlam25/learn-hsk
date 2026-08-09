require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const courseModel = require('../models/courseModel');
const lessonModel = require('../models/lessonModel');

// Nạp toàn bộ lesson{n}.json trong thư mục này (Bài 1–15, dữ liệu gốc dùng cấu trúc
// cũ exercises = { notes, grammar, chips, questions, reading, homework }).
function loadLessonFiles() {
  return fs
    .readdirSync(__dirname)
    .filter((f) => /^lesson\d+\.json$/.test(f))
    .map((f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf-8')))
    .sort((a, b) => a.lessonNumber - b.lessonNumber);
}

// Schema mới tách notes -> phoneticsNotes, grammar -> cột grammar riêng (để hiện tab
// 语音/语法 độc lập); phần còn lại (chips/questions/reading/homework) vẫn ở "exercises".
function toNewLessonShape(data, courseId) {
  const oldExercises = data.exercises || {};
  const { notes, grammar, ...restExercises } = oldExercises;
  return {
    ...data,
    courseId,
    phoneticsNotes: notes || [],
    grammar: grammar || [],
    exercises: restExercises,
    isPreview: data.lessonNumber === 1, // Bài 1 cho xem trước công khai để giới thiệu khoá học
  };
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
    if (exists) {
      console.log(`[seed] Bài ${data.lessonNumber} đã tồn tại, bỏ qua.`);
      continue;
    }
    const payload = { ...toNewLessonShape(data, course.id), createdBy: admin.id };
    await lessonModel.create(payload);
    console.log(`[seed] Đã tạo Bài ${data.lessonNumber} (${data.titleVi}).`);
  }

  console.log('[seed] Hoàn tất.');
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Lỗi:', err);
  process.exit(1);
});
