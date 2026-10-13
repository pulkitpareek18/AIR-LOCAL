# AirLocal

AirDrop-style file sharing for any device. Open the link on two devices on the same Wi-Fi — they discover each other automatically, tap to connect, and files stream directly device-to-device over WebRTC. Nothing is uploaded to any server.

## Architecture (why it costs ₹0)

| Layer | Technology | Cost |
|---|---|---|
| Hosting | Static Tailwind-built `index.html`, `app.js`, and `styles.css` on Vercel — no serverless functions, no KV | Free — unlimited static requests |
| Discovery + signaling | Cloudflare Worker + Durable Object (WebSocket room per network) | Free — 100k req/day, DO hibernation (idle = ₹0) |
| File transfer | WebRTC DataChannels, direct browser connection over your LAN | Free — bytes never touch a server |

## Setup (one time, ~3 minutes)

**1. Deploy the relay** (free Cloudflare account, no card):

```bash
cd worker
npx wrangler login
npx wrangler deploy
```

Wrangler prints your Worker URL, e.g. `https://airlocal-relay.you.workers.dev`.

**2. Point the app at it** — set the deployed Worker URL in the `RELAY_DEFAULT`
constant in [app.js](./app.js), then deploy the frontend. Users may override it
locally with:

```js
localStorage.setItem('airlocal.relay.v1', 'wss://your-worker.workers.dev');
```

**3. Build and deploy the static site:**

```bash
npm install
npm run build
npx vercel --prod
```

Vercel also runs `npm run build` automatically from [vercel.json](./vercel.json).
The production frontend uses compiled Tailwind CSS rather than the Tailwind CDN.

## Privacy and security

- File bytes never pass through the Worker or Vercel; WebRTC carries them directly
  between browsers.
- The Worker handles only room presence, WebRTC signaling, and transfer-control
  fallback messages.
- Room codes are discovery identifiers, not passwords. Anyone who knows a room
  code can see the devices in that room, so use a fresh code for sensitive files.
- QR pairing includes a device-specific token and is preferred over sharing a
  room code manually.
- The relay validates session identifiers, caps rooms at 12 peers, rejects
  oversized signaling payloads, and expires inactive sessions.

## Browser support and limits

AirLocal requires HTTPS, WebRTC, WebSockets, and Origin Private File System
(OPFS). Use a current Chrome, Edge, Safari, or Firefox release. Private browsing
or managed browsers may disable OPFS.

Queues over 100 files, 25 GB total, or 10 GB per file show a confirmation
warning rather than being blocked. This keeps normal use safe while allowing
larger transfers when the user confirms and the receiving device has enough
available storage. Actual transfer size and speed depend on the devices,
browser, network path, and available storage.

## Save locations

On browsers that support the File System Access API, the receiver can choose a
custom save folder from Settings. AirLocal can organize completed files into
`Images`, `Videos`, `Audio`, `Documents`, `Presentations`, `Archives`, and
`Other` subfolders. The folder permission is remembered when the browser allows
it.

If folder access is unavailable, permission is declined, or the permission
expires, AirLocal automatically falls back to the browser's normal Downloads
behavior. iOS Safari and some Firefox/private-browsing configurations
typically use this fallback.

The browser does not expose an absolute Finder/File Explorer path to web apps.
AirLocal therefore displays the selected folder name and the exact relative
destination path, including backup timestamps and type folders, in the
save-location panel and each completion message.

Backup folder names can be customized in Settings. The default convention is
`{date}/{time}`. Supported tokens are `{date}`, `{time}`, `{year}`, `{month}`,
`{day}`, `{hour}`, `{minute}`, and `{second}`. For example,
`Backup-{date}/{time}` creates `Backup-2026-10-13/09-45-27/`.

When a received file already exists in the destination, AirLocal offers
`Replace`, `Keep both`, `Skip`, and `Replace all` choices. Optional Backup mode
creates a new session folder such as `2026-10-13/09-45-12/` under the selected
folder for every connection. Backup sessions can either use the same file-type
subfolders or keep all files directly in that timestamped folder.

## Production release checklist

Before sharing a public URL:

1. Deploy the Worker and verify `/health` returns `{"ok":true,"v":1}`.
2. Run `npm install`, `npm run build`, and `npm run check`.
3. Deploy the frontend to Vercel over HTTPS.
4. Test QR pairing and manual room pairing across iOS, Android, macOS, Windows,
   and Linux.
5. Test a large file, a canceled transfer, a receiver-side cancellation, and a
   browser refresh during discovery.
6. Use a new room code for each sensitive sharing session.

## How discovery works

1. Each device belongs to a **4-digit room code** (OTP-style, e.g. `4821`) — stable, persisted, and editable.
2. Pair two ways:
   - **QR**: scan the on-page QR with any phone camera — it opens a device-specific link, joins the room, and automatically connects to the device that displayed the QR.
   - **Code**: share the 4-digit code verbally; the other device taps the room chip and enters it.
3. All devices in the same room see each other on any network (Wi-Fi, mobile data, hotel/library LANs — no IP-matching needed).
4. Tapping a peer sends a connect request → accept → SDP/ICE flow over the WebSocket (~5 KB). QR connections use their device pairing token to skip the approval prompt.
5. 4 parallel unordered data channels stream the file in 64 KB chunks straight to OPFS (disk) — RAM stays flat even for 10 GB+ files.
6. On startup, AirLocal clears abandoned files from its origin-private OPFS storage so interrupted transfers do not accumulate locally.

## Testing locally against the tunnel

The Worker must be deployed (or run `npx wrangler dev` and point `RELAY_URL` at `ws://localhost:8787`) before discovery shows peers — the static page alone has no relay.
