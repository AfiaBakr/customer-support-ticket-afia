import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { socketCorsOrigin } from '../config/cors.js';
import type { Role } from '../constants.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { verifyToken } from '../services/token.service.js';
import { assertCanView } from '../services/ticketAccess.js';

interface SocketUser {
  id: string;
  role: Role;
  name: string;
}

interface SocketData {
  user: SocketUser;
}

let io: Server | null = null;

export function ticketRoom(ticketId: string): string {
  return `ticket:${ticketId}`;
}

export function initSockets(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      credentials: true,
      origin(origin, callback) {
        if (socketCorsOrigin(origin ?? undefined)) return callback(null, true);
        return callback(new Error('Origin not allowed by CORS'), false);
      },
    },
  });

  // --- Authenticate every socket connection with the same JWT as the REST API.
  io.use(async (socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.headers.authorization?.replace('Bearer ', '') || undefined);
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);
      const user = await User.findById(payload.id).lean();
      if (!user) return next(new Error('Account not found'));

      (socket.data as SocketData).user = {
        id: String(user._id),
        role: user.role,
        name: user.name,
      };
      next();
    } catch {
      next(new Error('Invalid or expired session'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { user } = socket.data as SocketData;

    // Agents & admins listen on a shared room for queue-wide dashboard updates.
    if (user.role === 'agent' || user.role === 'admin') {
      socket.join('agents');
    }

    socket.on('join-ticket', async (ticketId: string, ack?: (res: unknown) => void) => {
      try {
        const ticket = await Ticket.findById(ticketId)
          .select('customerId assignedAgentId')
          .lean();
        if (!ticket) throw new Error('Ticket not found');
        assertCanView(user, ticket);
        await socket.join(ticketRoom(ticketId));
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: (err as Error).message });
      }
    });

    socket.on('leave-ticket', (ticketId: string) => {
      socket.leave(ticketRoom(ticketId));
    });

    // Optional: allow posting a message straight over the socket.
    socket.on(
      'ticket-message',
      async (
        payload: { ticketId: string; message: string },
        ack?: (res: unknown) => void,
      ) => {
        try {
          const { createMessage } = await import('../services/message.service.js');
          const message = await createMessage({
            ticketId: payload.ticketId,
            text: payload.message,
            actor: user,
          });
          ack?.({ ok: true, message });
        } catch (err) {
          ack?.({ ok: false, error: (err as Error).message });
        }
      },
    );

    socket.on('disconnect', () => {
      // socket.io leaves all rooms automatically; nothing else to clean up.
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO has not been initialised');
  return io;
}

/* ---- Emit helpers used by controllers / services ---- */

export function emitNewMessage(ticketId: string, message: unknown): void {
  io?.to(ticketRoom(ticketId)).emit('new-message', message);
}

export function emitTicketUpdated(ticketId: string, ticket: unknown): void {
  io?.to(ticketRoom(ticketId)).emit('ticket-updated', ticket);
  io?.to('agents').emit('ticket-updated', ticket);
}

export function emitStatusUpdated(
  ticketId: string,
  payload: { ticketId: string; status: string; ticket: unknown },
): void {
  io?.to(ticketRoom(ticketId)).emit('ticket-status-updated', payload);
  io?.to('agents').emit('ticket-status-updated', payload);
}

export function emitTicketCreated(ticket: unknown): void {
  io?.to('agents').emit('ticket-created', ticket);
}
