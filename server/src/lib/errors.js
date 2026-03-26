export function createApiError(status, code, message, details = undefined) {
  return {
    status,
    body: {
      error: {
        code,
        message,
        ...(details ? { details } : {})
      }
    }
  };
}
