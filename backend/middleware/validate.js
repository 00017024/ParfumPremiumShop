"use strict";

const ApiError = require("../utils/ApiError");

/**
 * Express middleware factory for Joi schema validation.
 *
 * @param {import("joi").Schema} schema      - Joi schema to validate against
 * @param {"body"|"query"|"params"} [source] - Request property to validate (default: "body")
 * @param {import("joi").ValidationOptions}  [joiOptions] - Joi option overrides
 *
 * On success: replaces req[source] with the validated (and stripped/coerced) value,
 *             then calls next().
 *
 * On failure: builds an ApiError(400) with:
 *   - message:  "Validation failed"
 *   - code:     "VALIDATION_ERROR"
 *   - details:  [ "human-readable message per failing field" ]
 *
 * Default Joi options:
 *   abortEarly:   false  — collect ALL errors, not just the first
 *   stripUnknown: true   — silently drop fields not declared in the schema
 *   convert:      true   — coerce types (string "10" → number 10, etc.)
 */
const validate = (schema, source = "body", joiOptions = {}) => {
  const options = {
    abortEarly:   false,
    stripUnknown: true,
    convert:      true,
    ...joiOptions,
  };

  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], options);

    if (error) {
      const details = error.details.map((d) => d.message);

      return next(
        new ApiError(400, "Validation failed", "VALIDATION_ERROR", details)
      );
    }

    req[source] = value;
    next();
  };
};

module.exports = validate;
