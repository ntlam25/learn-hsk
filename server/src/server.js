require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const { publicRouter: publicCourseRoutes, adminRouter: adminCourseRoutes } = require('./routes/course.routes');
const {
  publicRouter: publicLessonRoutes,
  courseLessonsRouter,
  adminRouter: adminLessonRoutes,
} = require('./routes/lesson.routes');
const exerciseRoutes = require('./routes/exercise.routes');
const classRoutes = require('./routes/class.routes');
const meRoutes = require('./routes/me.routes');
const { publicRouter: publicSettingsRoutes, adminRouter: adminSettingsRoutes } = require('./routes/settings.routes');
const uploadRoutes = require('./routes/upload.routes');

// Khởi tạo client Supabase sớm để lỗi thiếu biến môi trường (SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY) hiện ra ngay khi start thay vì khi có request đầu tiên.
require('./config/supabase');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/admin/users', userRoutes);

app.use('/api/courses', publicCourseRoutes);
app.use('/api/courses/:courseId/lessons', courseLessonsRouter);
app.use('/api/admin/courses', adminCourseRoutes);

app.use('/api/lessons', publicLessonRoutes);
app.use('/api/lessons/:lessonId', exerciseRoutes);
app.use('/api/admin/lessons', adminLessonRoutes);

app.use('/api/admin/classes', classRoutes);
app.use('/api/me', meRoutes);

app.use('/api/settings', publicSettingsRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);

app.use('/api/admin/uploads', uploadRoutes);

// Xử lý lỗi tập trung — mọi controller async ném lỗi sẽ rơi vào đây (nhờ asyncHandler)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Lỗi server.' });
});

app.use((req, res) => res.status(404).json({ message: 'Không tìm thấy route.' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[server] Đang chạy tại http://localhost:${PORT}`));
