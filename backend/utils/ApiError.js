class ApiError extends Error {
  /**
   * @param {number}   statusCode - HTTP status code
   * @param {string}   message    - Human-readable summary
   * @param {string}   [code]     - Machine-readable error code
   * @param {string[]} [details]  - Per-field validation messages
   */
  constructor(statusCode, message, code = null, details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code       = code;
    this.details    = details; // always an array; empty for non-validation errors
  }
}

module.exports = ApiError;
