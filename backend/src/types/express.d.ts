import type { Role } from '../constants';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the requireAuth middleware. */
      user?: {
        id: string;
        role: Role;
        name: string;
        email: string;
      };
      /** Parsed & coerced query params, populated by validate(schema, 'query'). */
      validatedQuery?: Record<string, unknown>;
    }
  }
}

export {};
