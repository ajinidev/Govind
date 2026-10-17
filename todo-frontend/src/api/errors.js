/** Thrown for any non-2xx response. `fields` is populated for 422 validation errors. */
export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
