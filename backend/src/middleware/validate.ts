import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError';

type Source = 'body' | 'query' | 'params';

/**
 * Validates and coerces a request section against a Zod schema.
 * On success the parsed value replaces `req.body` / `req.params`, or is stored
 * on `req.validatedQuery` (Express query objects should not be reassigned).
 */
export const validate =
  (schema: ZodTypeAny, source: Source = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(ApiError.unprocessable('Validation failed', details));
    }

    if (source === 'query') {
      req.validatedQuery = result.data as Record<string, unknown>;
    } else {
      req[source] = result.data as never;
    }
    next();
  };
