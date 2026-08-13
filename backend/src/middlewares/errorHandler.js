export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || err.status || 500;
  const isOperational = err.expose || statusCode < 500;
  const message = isOperational ? err.message : 'Internal Server Error';
  const details = Array.isArray(err.details) ? err.details : [];

  console.error('[errorHandler]', {
    code: err.code || 'INTERNAL_ERROR',
    statusCode,
    message: err.message,
    details,
    stack: err.stack
  });

  const payload = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
      details
    }
  };

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}
