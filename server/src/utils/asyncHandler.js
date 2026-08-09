// Bọc các controller async: nếu Promise reject, next(err) sẽ được gọi
// tự động thay vì làm crash process hoặc treo request.
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
