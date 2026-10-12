# AirLocal

AirDrop-style file sharing for any device. Open the link on two devices on the same Wi-Fi — they discover each other automatically, tap to connect, and files stream directly device-to-device over WebRTC. Nothing is uploaded to any server.

## Architecture (why it costs ₹0)

| Layer | Technology | Cost |
|---|---|---|
| Hosting | Single static `index.html` on Vercel — no serverless functions, no KV | Free — unlimited static requests |
| Discovery + signaling | Cloudflare Worker + Durable Object (WebSocket room per network) | Free — 100k req/day, DO hibernation (idle = ₹0) |
| File transfer | WebRTC DataChannels, direct P2P over your LAN | Free — bytes never touch a server |

## Setup (one time, ~3 minutes)

**1. Deploy the relay** (free Cloudflare account, no card):

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Wrangler prints your Worker URL, e.g. `https://airlocal-relay.you.workers.dev`.

**2. Point the app at it** — in [index.html](../index.html), set:

```js
const RELAY_URL = 'wss://airlocal-relay.you.workers.dev';
```

> Or skip editing code: open the app once and run
> `localStorage.setItem('airlocal.relay', 'wss://your-worker.workers.dev')` in the console.

**3. Deploy the static site:**

```bash
npx vercel --prod
```

That's it — no env vars, no build step, no database.

### No-signup quick start

Don't want a Cloudflare login yet? Deploy to a free temporary preview account (live for 60 minutes):

```bash
cd worker
npx wrangler deploy --temporary
```

A currently-deployed temporary relay is baked in for instant testing:
`wss://airlocal-relay.iridescent-alarm.workers.dev` — it expires, so deploy your own Worker for production.

## How discovery works

1. Each device belongs to a **4-digit room code** (OTP-style, e.g. `4821`) — stable, persisted, and editable.
2. Pair two ways:
   - **QR**: scan the on-page QR with any phone camera — it opens `?room=<code>`, which auto-joins that room.
   - **Code**: share the 4-digit code verbally; the other device taps the room chip and enters it.
3. All devices in the same room see each other on any network (Wi-Fi, mobile data, hotel/library LANs — no IP-matching needed).
4. Tapping a peer sends a connect request → accept → SDP/ICE flow over the WebSocket (~5 KB).
5. 4 parallel unordered data channels stream the file in 64 KB chunks straight to OPFS (disk) — RAM stays flat even for 10 GB+ files.

## Testing locally against the tunnel

The Worker must be deployed (or run `npx wrangler dev` and point `RELAY_URL` at `ws://localhost:8787`) before discovery shows peers — the static page alone has no relay.

