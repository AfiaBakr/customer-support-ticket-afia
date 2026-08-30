import type { ErrorRequestHandler, RequestHandler } from 'express';
import { isDev } from '../config/env';
import { ApiError } from '../utils/ApiError';

export const notFound: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isApi = err instanceof ApiError;

  // Mongo duplicate-key error
  if (!isApi && err && typeof err === 'object' && (err as { code?: number }).code === 11000) {
    res.status(409).json({
      error: { message: 'A record with these details already exists' },
    });
    return;
  }

  const status = isApi ? err.status : 500;

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({
    error: {
      message: isApi ? err.message : 'Something went wrong on our end',
      ...(isApi && err.details ? { details: err.details } : {}),
      ...(isDev && !isApi
        ? { debug: String((err as { message?: string })?.message ?? err) }
        : {}),
    },
  });
};
