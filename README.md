# AirLocal

AirDrop-style file sharing for any device. Open the link on two devices on the same Wi-Fi — they discover each other automatically, tap to connect, and files transfer directly device-to-device over WebRTC. Nothing is uploaded to any server.

## Architecture (why hosting costs ₹0)

| Layer | Technology | Cost |
|---|---|---|
| Hosting | Single static `index.html` on Vercel (no serverless functions, no KV) | Free — unlimited static requests |
| Discovery + handshake signaling | Free public MQTT-over-WebSocket brokers (EMQX / HiveMQ clusters) — a few KB per pairing | Free |
| File transfer | WebRTC DataChannels, direct P2P over your LAN | Free — data never touches a server |

## How it works

1. Each device hashes its public IP → a per-network MQTT topic (`airlocal/v1/disc/<hash>`).
2. Devices announce name + device type every 3s on that topic and maintain a live peer list (9s TTL).
3. Tapping a peer sends a connect request → the receiver accepts → SDP offer/answer + ICE candidates flow via the relay (±5 KB total).
4. 4 parallel unordered data channels stream the file in 64 KB chunks with offset-prefix random-access writes straight into OPFS (disk), so RAM usage stays flat even for multi-GB files.

## Deploy

```bash
npx vercel --prod
```

That's it. No environment variables, no build step, no server.

> To connect, devices must be on the same network and the URL must be HTTPS (Vercel gives you both by default).
