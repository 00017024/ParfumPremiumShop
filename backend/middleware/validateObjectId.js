const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

const validateObjectId = (paramName) => (req, _res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return next(new ApiError(400, "Invalid ID", "INVALID_ID"));
  }
  next();
};

module.exports = validateObjectId;
