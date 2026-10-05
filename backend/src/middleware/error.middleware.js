/**
 * Centralized Error Handling Middleware
 * Ensures sensitive database internal errors and stack traces are never leaked to clients.
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  // Always log full error securely server-side
  console.error('[Server Error]', {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Invalid request payload',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle standard HTTP / known operational errors
  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      error: err.name || 'ClientError',
      message: err.message
    });
  }

  // Handle PostgreSQL syntax or constraint errors without leaking internal DB details
  if (err.code && typeof err.code === 'string' && err.code.length === 5) {
    // 23505 = unique_violation, 23503 = foreign_key_violation, 42P01 = undefined_table, etc.
    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A resource with this identifier already exists.'
      });
    }
    if (err.code === '23503') {
      return res.status(400).json({
        error: 'ForeignKeyViolation',
        message: 'Referenced parent resource was not found.'
      });
    }
    // Generic fallback for any other SQL/database error
    return res.status(500).json({
      error: 'DatabaseError',
      message: 'A database error occurred while processing your request.'
    });
  }

  // Generic 500 Internal Server Error
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected internal server error occurred.'
  });
};
