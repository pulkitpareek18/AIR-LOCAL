// AirLocal relay — Cloudflare Worker + Durable Object
// Presence + WebRTC signaling over WebSocket. File bytes NEVER touch this.
// Free tier: 100k req/day + DO hibernation (idle costs nothing).

const PROTO_VER = 1;
const STALE_MS = 15000;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true, v: PROTO_VER }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const match = url.pathname.match(/^\/room\/([a-z0-9-]{1,64})$/);
    if (!match) {
      return new Response('Not found', { status: 404 });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const id = env.ROOM.idFromName(match[1]);
    const stub = env.ROOM.get(id);
    return stub.fetch(request);
  },
};

export class Room {
  constructor(state) {
    this.state = state;
    this.state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('"ping"', '"pong"'));
    // Hibernation-proof: rebuild roster from live sockets + attachments
    this.peers = new Map();
    for (const ws of this.state.getWebSockets()) {
      const att = ws.deserializeAttachment();
      if (att && att.sid) this.peers.set(att.sid, { ws, name: att.name, kind: att.kind });
    }
  }

  async fetch(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.state.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    if (!msg || msg.v !== PROTO_VER || typeof msg.sid !== 'string') return;

    switch (msg.type) {
      case 'ping':
        return; // app-level keep-alive; presence refresh happens via roster broadcast
      case 'join': {
        const name = String(msg.name || 'Device').slice(0, 48);
        const kind = String(msg.kind || 'other').slice(0, 16);
        ws.serializeAttachment({ sid: msg.sid, name, kind });
        this.peers.set(msg.sid, { ws, name, kind });
        this.broadcastPeers();
        break;
      }
      case 'signal': {
        const target = this.peers.get(msg.to);
        const sender = this.peers.get(msg.sid);
        if (target && target.ws.readyState === 1) {
          target.ws.send(JSON.stringify({
            v: PROTO_VER, type: 'signal', from: msg.sid, name: sender?.name || 'Device', payload: msg.payload,
          }));
        }
        break;
      }
      case 'leave': {
        this.removePeer(msg.sid);
        break;
      }
    }
  }

  async webSocketClose(ws) { this.dropSocket(ws); }
  async webSocketError(ws) { this.dropSocket(ws); }

  dropSocket(ws) {
    const att = ws.deserializeAttachment();
    const sid = att && att.sid;
    if (sid && this.peers.get(sid)?.ws === ws) {
      this.peers.delete(sid);
      this.broadcastPeers();
    }
  }

  removePeer(sid) {
    if (!this.peers.has(sid)) return;
    const p = this.peers.get(sid);
    this.peers.delete(sid);
    try { p.ws.close(); } catch {}
    this.broadcastPeers();
  }

  broadcastPeers() {
    const roster = [];
    for (const [sid, p] of this.peers) roster.push({ sid, name: p.name, kind: p.kind });
    const frame = JSON.stringify({ v: PROTO_VER, type: 'peers', peers: roster });
    const dead = [];
    for (const [sid, p] of this.peers) {
      if (p.ws.readyState === 1) {
        try { p.ws.send(frame); } catch { dead.push(sid); }
      } else if (p.ws.readyState > 1) {
        dead.push(sid);
      }
    }
    for (const sid of dead) this.peers.delete(sid);
  }
}
