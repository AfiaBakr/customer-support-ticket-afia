import cors from 'cors';
import express, { type Express } from 'express';
import morgan from 'morgan';
import { corsOptions } from './config/cors.js';
import { isDev } from './config/env';
import { errorHandler, notFound } from './middleware/error';
import api from './routes';

export function createApp(): Express {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json({ limit: '1mb' }));

  if (isDev) {
    app.use(morgan('dev'));
    // Extra visibility while debugging connectivity: log Origin + final status.
    app.use((req, res, next) => {
      const origin = req.headers.origin ?? '(no origin)';
      res.on('finish', () => {
        console.log(
          `[req] ${req.method} ${req.originalUrl} ← origin ${origin} → ${res.statusCode}`,
        );
      });
      res.on('close', () => {
        if (!res.writableEnded) {
          console.warn(
            `[req] ${req.method} ${req.originalUrl} ← origin ${origin} → CONNECTION CLOSED before response finished`,
          );
        }
      });
      next();
    });
  }

  app.get('/', (_req, res) => {
    res.json({ name: 'SupportFlow API', health: '/api/health' });
  });

  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
