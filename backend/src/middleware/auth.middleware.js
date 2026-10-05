import { z } from 'zod';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_USER_ID = process.env.DEFAULT_USER_ID || '00000000-0000-0000-0000-000000000001';

/**
 * Authentication & Tenant Context Middleware
 * Extracts the user UUID from request headers (x-user-id or Authorization bearer)
 * or falls back to the configured DEFAULT_USER_ID.
 * Validates UUID format to protect the downstream PostgreSQL RLS session setting.
 */
export const authenticateUser = (req, res, next) => {
  let userId = req.headers['x-user-id'];

  const authHeader = req.headers['authorization'];
  if (!userId && authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      userId = authHeader.slice(7).trim();
    } else {
      userId = authHeader.trim();
    }
  }

  // Fallback for seamless demo/testing
  if (!userId) {
    userId = DEFAULT_USER_ID;
  }

  // Validate UUID structure
  if (!UUID_REGEX.test(userId)) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or malformed user identity identifier (UUID required for RLS isolation).'
    });
  }

  req.userId = userId;
  next();
};
