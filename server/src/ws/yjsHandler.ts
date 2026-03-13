import { WebSocketServer, type WebSocket } from 'ws';
import type { IncomingMessage } from 'http';
import type { Server } from 'http';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { verifyToken } from '../lib/jwt.js';

export function attachYjsWebSocket(httpServer: Server): () => void {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    // setupWSConnection needs the request to extract the room name from the URL path
    setupWSConnection(ws, req, { gc: true });
  });

  const upgradeHandler = async (req: IncomingMessage, socket: import('stream').Duplex, head: Buffer) => {
    // Fix 1: use a static base — the host component only exists to satisfy the URL constructor
    const url = new URL(req.url ?? '/', 'http://localhost');

    // Only handle upgrades on /yjs/* paths
    if (!url.pathname.startsWith('/yjs/')) {
      socket.destroy();
      return;
    }

    // Validate JWT from ?token= query param
    const token = url.searchParams.get('token');
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      await verifyToken(token);
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  };

  httpServer.on('upgrade', upgradeHandler);

  // Fix 2: return cleanup so callers can tear down the listener and close the wss
  return () => {
    httpServer.off('upgrade', upgradeHandler);
    wss.close();
  };
}
