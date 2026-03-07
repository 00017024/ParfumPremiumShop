const ApiError = require("../utils/ApiError");

const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return next(
        new ApiError(
          400,
          error.details.map(d => d.message).join(", "),
          "VALIDATION_ERROR"
        )
      );
    }

    req[property] = value;
    next();
  };
};

module.exports = validate;
