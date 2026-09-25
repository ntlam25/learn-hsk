// Báo cho sidebar học viên tải lại danh sách lớp (sau khi vào lớp bằng mã)
export const CLASSES_CHANGED = 'hanzi:classes-changed';
export const notifyClassesChanged = () => window.dispatchEvent(new Event(CLASSES_CHANGED));
