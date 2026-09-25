import { createContext, useContext } from 'react';

// Trang khoá học / trang xem bài báo cho sidebar học viên biết khoá nào đang mở (để xổ danh sách bài)
// và khi nào cần tải lại (vừa hoàn thành bài). Ngoài StudentLayout (khách, GV, admin) thì là hàm rỗng.
const noop = () => {};
export const CourseNavContext = createContext({ activeCourseId: null, version: 0, setActiveCourse: noop, refresh: noop });

export const useCourseNav = () => useContext(CourseNavContext);
