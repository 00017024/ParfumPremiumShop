const mongoose = require("mongoose");

const ApiError = require("../utils/ApiError");

/**
 * Purpose: Factory that returns middleware to validate a named route param as a MongoDB ObjectId.
 * Input: paramName – the req.params key to check (e.g. 'id')
 * Output: Calls next() if valid; passes a 400 ApiError if the value is not a valid ObjectId.
 */
const validateObjectId = (paramName) => (req, _res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return next(new ApiError(400, "Invalid ID", "INVALID_ID"));
  }
  next();
};

module.exports = validateObjectId;
