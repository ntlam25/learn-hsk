const enrollmentModel = require('../models/enrollmentModel');
const courseModel = require('../models/courseModel');

// GET /api/me/courses (student) — chỉ course đã được thêm vào ít nhất 1 lớp
async function myCourses(req, res) {
  const courseIds = await enrollmentModel.courseIdsForStudent(req.user.id);
  if (!courseIds.length) return res.json([]);
  const courses = await Promise.all(courseIds.map((id) => courseModel.getById(id)));
  res.json(courses.filter(Boolean));
}

module.exports = { myCourses };
