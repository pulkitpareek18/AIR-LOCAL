  // ================================================================
  //  AirLocal — shadcn-styled, zero-Vercel-backend
  //  Discovery + signaling: Cloudflare Worker Durable Object (WS)
  //  Transfer: WebRTC DataChannels, direct P2P (4×unordered, 64KB)
  // ================================================================

  // Deployed relay (Cloudflare Worker).
  // Use the versioned key so stale values from older builds cannot trap a
  // phone on an obsolete relay. A custom relay can still be supplied with
  // localStorage.setItem('airlocal.relay.v1', 'wss://your-worker.workers.dev').
  const RELAY_DEFAULT = 'wss://airlocal-relay.pulkitpareekofficial.workers.dev';
  const RELAY_URL = localStorage.getItem('airlocal.relay.v1') || RELAY_DEFAULT;

  const CHUNK_SIZE = 64 * 1024;
  const NUM_CHANNELS = 4;
  const BUFFER_HIGH = 4 * 1024 * 1024;
  const BUFFER_LOW = 1 * 1024 * 1024;
  const PROTO_VER = 1;
  const SESSION_ID = crypto.randomUUID();
  const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

  const ADJ = ['Amber','Azure','Crimson','Jade','Ivory','Onyx','Ruby','Slate','Cobalt','Ember','Frost','Nova','Pixel','Quartz','Sage','Storm','Vivid','Zephyr','Lunar','Bolt'];
  const NOUN = { ios: ['iPhone','iPad','MacBook'], android: ['Pixel','Galaxy','OnePlus','Xiaomi'], windows: ['Surface','ThinkPad','Legion'], mac: ['MacBook','iMac','Mac'], linux: ['TuxBox','Framework','XPS'], other: ['Comet','Rover','Kite','Orbit'] };

  // ---------- State ----------
  let networkId = null;
  let ws = null;
  let wsOpen = false;
  let reconnectTimer = null;
  let deviceName = localStorage.getItem('airlocal.name') || '';
  const deviceKind = detectKind();
  const peers = new Map();          // sid -> {sid, name, kind}
  let pc = null;
  let channels = [];
  let activePeer = null;
  let pendingPeer = null;
  let pendingIncoming = null;       // { from, name }
  let qrTargetSid = null;
  let qrPairToken = null;
  let qrConnectionStarted = false;
  let stagedFiles = [];
  const sendTransfers = new Map();
  const receiveTransfers = new Map();
  let nextTransferId = 1;
  let peerDisconnectTimer = null;
  let transmitRunning = false;
  let transferGeneration = 0;
  let pendingConfirmation = null;

  // ---------- Utils ----------
  function detectKind() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Windows/.test(ua)) return 'windows';
    if (/Macintosh/.test(ua)) return 'mac';
    if (/Linux/.test(ua)) return 'linux';
    return 'other';
  }
  function iconFor(kind) {
    return { ios: 'smartphone', android: 'smartphone', windows: 'monitor', mac: 'laptop', linux: 'hard-drive' }[kind] || 'monitor';
  }
  const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  const randomName = () => `${ADJ[Math.floor(Math.random()*ADJ.length)]} ${NOUN[deviceKind][Math.floor(Math.random()*NOUN[deviceKind].length)]}`;

  // ---------- Room code (4-digit OTP, shareable or QR-scannable) ----------
  function generateRoom() { return String(Math.floor(1000 + Math.random() * 9000)); }
  function sanitizeRoom(s) { return String(s || '').replace(/[^0-9]/g, '').slice(0, 4); }
  function sanitizeSid(value) {
    return /^[0-9a-f-]{36}$/i.test(String(value || '')) ? String(value) : null;
  }
  const pairingToken = localStorage.getItem('airlocal.pairing-token') ||
    (() => {
      const token = crypto.randomUUID();
      localStorage.setItem('airlocal.pairing-token', token);
      return token;
    })();
  function getRoom() {
    // URL deep-link (from QR scan) wins; else persisted room; else generate
    const urlRoom = sanitizeRoom(new URLSearchParams(location.search).get('room'));
    if (urlRoom && urlRoom.length === 4) {
      localStorage.setItem('airlocal.room', urlRoom);
      const target = sanitizeSid(new URLSearchParams(location.search).get('device'));
      history.replaceState(null, '', target ? `${location.pathname}?device=${encodeURIComponent(target)}` : location.pathname);
      return urlRoom;
    }
    let room = sanitizeRoom(localStorage.getItem('airlocal.room'));
    if (!room || room.length !== 4) {
      room = generateRoom();
      localStorage.setItem('airlocal.room', room);
    }
    return room;
  }
  function setRoom(room) {
    localStorage.setItem('airlocal.room', room);
    networkId = room;
    document.getElementById('networkLabel').textContent = room;
    document.getElementById('selfRoomHint').textContent = room;
    renderQr();
    try { if (ws) ws.close(); } catch {} // reconnect into the new room
  }
  function editRoom() {
    const input = prompt('Enter the 4-digit room code (same on every device):', getRoom());
    if (input === null) return;
    const room = sanitizeRoom(input);
    if (room.length !== 4) return alert('Room code must be exactly 4 digits.');
    setRoom(room);
  }
  function roomUrl() {
    const params = new URLSearchParams({ room: getRoom(), device: SESSION_ID, pair: pairingToken });
    return `${location.origin}${location.pathname}?${params}`;
  }
  function renderQr() {
    const box = document.getElementById('qrBox');
    if (!box || typeof QRCode === 'undefined') return;
    box.innerHTML = '';
    new QRCode(box, { text: roomUrl(), width: 132, height: 132, correctLevel: QRCode.CorrectLevel.M, colorDark: '#18181b', colorLight: '#fafafa' });
  }

  function log(msg, type = 'info') {
    const logs = document.getElementById('eventLogs');
    const row = document.createElement('div');
    const time = new Date().toLocaleTimeString([], { hour12: false });
    const tone = type === 'error' ? 'text-red-400' : type === 'success' ? 'text-foreground' : 'text-muted-foreground';
    row.innerHTML = `<span class="text-zinc-600">[${time}]</span> <span class="${tone}">${esc(msg)}</span>`;
    logs.appendChild(row);
    logs.scrollTop = logs.scrollHeight;
  }

  function setStatus(label, mode) {
    document.getElementById('statusText').innerText = label;
    const dot = document.getElementById('statusDot');
    const ping = document.getElementById('statusPing');
    const tones = {
      online: 'bg-success',
      busy: 'bg-amber-500',
      off: 'bg-zinc-500',
    };
    dot.className = `relative inline-flex h-2 w-2 rounded-full ${tones[mode] || tones.off}`;
    ping.className = `absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${tones[mode] || tones.off}`;
    ping.style.display = mode === 'online' ? 'none' : '';
    const ds = document.getElementById('discoveryState');
    ds.innerText = mode === 'online' ? 'online' : mode === 'busy' ? 'pairing' : 'connecting';
    ds.className = `mt-0.5 text-xs font-medium ${mode === 'online' ? 'text-success' : 'text-amber-500'}`;
  }

  const fmtMB = b => `${(b / 1048576).toFixed(1)} MB`;
  const fmtSpeed = bps => bps > 0 ? `${(bps / 1048576).toFixed(1)} MB/s` : '—';
  function formatETA(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '—';
    const total = Math.ceil(seconds);
    if (total < 60) return `${total}s`;
    return `${Math.floor(total / 60)}m ${String(total % 60).padStart(2, '0')}s`;
  }
  function updateTransferTelemetry(map, id, progress) {
    const transfer = map.get(id);
    if (!transfer) return;
    const now = performance.now();
    const elapsed = (now - transfer.lastSampleTime) / 1000;
    transfer.progress = progress;
    if (elapsed >= 0.25) {
      const instantSpeed = (progress - transfer.lastSampleBytes) / elapsed;
      transfer.speed = transfer.speed ? transfer.speed * 0.7 + instantSpeed * 0.3 : instantSpeed;
      transfer.lastSampleTime = now;
      transfer.lastSampleBytes = progress;
    }
    if (now - (transfer.lastRenderTime || 0) >= 50 || progress >= transfer.size) {
      transfer.lastRenderTime = now;
      updateTransferCard(transfer);
      updateActivitySpeed();
    }
  }

  function finalizeTransferTelemetry(transfer) {
    const elapsed = (performance.now() - transfer.startedAt) / 1000;
    if (elapsed > 0 && transfer.progress > 0) {
      transfer.speed = transfer.progress / elapsed;
    }
  }
  function transferCard(transfer) {
    const pct = transfer.size ? Math.min(100, Math.round((transfer.progress / transfer.size) * 100)) : 0;
    const tone = transfer.status === 'complete' ? 'bg-success' : transfer.status === 'error' ? 'bg-red-500' : 'bg-primary';
    const label = transfer.status === 'complete' ? 'Complete' : transfer.status === 'error' ? 'Failed' : transfer.status === 'stopped' ? 'Stopped' : transfer.status === 'queued' ? 'Queued' : `${pct}%`;
    const canCancel = transfer.status === 'active' || transfer.status === 'queued';
    return `<div class="rounded-md border border-border bg-background/50 p-3" data-transfer-id="${transfer.id}" data-direction="${transfer.direction}">
      <div class="mb-2 flex items-center justify-between gap-3">
        <span class="min-w-0 truncate text-xs font-medium">${esc(transfer.name)}</span>
        <span class="flex shrink-0 items-center gap-2">
          <span class="transfer-label text-[10px] font-medium tabular-nums text-muted-foreground">${label}</span>
          ${canCancel ? `<button type="button" onclick="cancelTransfer('${transfer.direction}', '${transfer.id}')" class="rounded px-1 text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-red-400">${transfer.status === 'active' ? 'Cancel' : 'Remove'}</button>` : ''}
        </span>
      </div>
      <div class="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div class="transfer-progress h-full rounded-full ${tone}" style="width:${pct}%"></div>
      </div>
      <div class="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span class="transfer-bytes tabular-nums">${fmtMB(transfer.progress)} / ${fmtMB(transfer.size)}</span>
        <span class="transfer-metrics tabular-nums">${transfer.status === 'active' ? `${fmtSpeed(transfer.speed)} · ETA ${formatETA((transfer.size - transfer.progress) / transfer.speed)}` : transfer.status === 'complete' ? 'Complete' : ''}</span>
      </div>
    </div>`;
  }
  function filePath(file) {
    return file.webkitRelativePath || file.name;
  }
  function updateTransferCard(transfer) {
    const card = document.querySelector(`[data-transfer-id="${CSS.escape(transfer.id)}"][data-direction="${transfer.direction}"]`);
    if (!card) return;
    const pct = transfer.size ? Math.min(100, Math.round((transfer.progress / transfer.size) * 100)) : 0;
    card.querySelector('.transfer-progress')?.style.setProperty('width', `${pct}%`);
    const bytes = card.querySelector('.transfer-bytes');
    const metrics = card.querySelector('.transfer-metrics');
    const label = card.querySelector('.transfer-label');
    if (bytes) bytes.textContent = `${fmtMB(transfer.progress)} / ${fmtMB(transfer.size)}`;
    if (metrics) metrics.textContent = transfer.status === 'active'
      ? `${fmtSpeed(transfer.speed)} · ETA ${formatETA((transfer.size - transfer.progress) / transfer.speed)}`
      : transfer.status === 'complete' ? 'Complete' : transfer.status;
    if (label) label.textContent = transfer.status === 'active' ? `${pct}%` : transfer.status === 'stopped' ? 'Stopped' : transfer.status;
  }
  function renderTransfers() {
    for (const [map, containerId, emptyId, countId] of [
      [sendTransfers, 'sentTransfers', 'sentEmpty', 'sentCount'],
      [receiveTransfers, 'receivedTransfers', 'receivedEmpty', 'receivedCount'],
    ]) {
      const container = document.getElementById(containerId);
      container.innerHTML = [...map.values()].map(transferCard).join('');
      document.getElementById(emptyId).classList.toggle('hidden', map.size > 0);
      document.getElementById(countId).innerText = String(map.size);
    }
    const activeSpeeds = [...sendTransfers.values(), ...receiveTransfers.values()]
      .filter(transfer => transfer.status === 'active')
      .reduce((total, transfer) => total + (transfer.speed || 0), 0);
    const activitySpeed = document.getElementById('speedValue');
    if (activitySpeed) activitySpeed.innerText = `${(activeSpeeds / 1048576).toFixed(1)} MB/s`;
  }
  function updateTransfer(map, id, patch) {
    const transfer = map.get(id);
    if (!transfer) return;
    Object.assign(transfer, patch);
    renderTransfers();
  }
  function updateActivitySpeed() {
    const speed = [...sendTransfers.values(), ...receiveTransfers.values()]
      .filter(transfer => transfer.status === 'active')
      .reduce((total, transfer) => total + (transfer.speed || 0), 0);
    const activitySpeed = document.getElementById('speedValue');
    if (activitySpeed) activitySpeed.innerText = `${(speed / 1048576).toFixed(1)} MB/s`;
  }
  function sendTransferControl(type, transferId) {
    const message = JSON.stringify({ type, transferId });
    channels.filter(ch => ch.readyState === 'open').forEach(ch => {
      try { ch.send(message); } catch {}
    });
  }
  function cancelTransfer(direction, id) {
    const map = direction === 'send' ? sendTransfers : receiveTransfers;
    const transfer = map.get(id);
    if (!transfer || !['active', 'queued'].includes(transfer.status)) return;
    if (transfer.status === 'queued') {
      transfer.cancelled = true;
      map.delete(id);
      renderTransfers();
      return;
    }
    transfer.cancelled = true;
    transfer.status = 'stopped';
    transfer.permissionResolved = true;
    transfer.resolvePermission?.(false);
    if (direction === 'send' && activePeer) {
      sendTransferControl('CANCEL', id);
    }
    if (direction === 'receive') discardReceiveTransfer(transfer);
    renderTransfers();
  }

  // ---------- Room identity (was: IP-hashed network id) ----------

  // ---------- Relay WebSocket ----------
  function dbg(msg) {
    // on-screen debug for mobile (no devtools): triple-tap the header to peek
    window.__dbg = window.__dbg || [];
    window.__dbg.push(new Date().toISOString().slice(11,19) + ' ' + msg);
    if (window.__dbg.length > 14) window.__dbg.shift();
    const el = document.getElementById('dbgOverlay');
    if (el && !el.classList.contains('hidden')) el.textContent = window.__dbg.join('\n');
  }
  window.addEventListener('unhandledrejection', e => dbg('REJECT: ' + (e.reason?.message || e.reason)));
  window.addEventListener('error', e => dbg('ERR: ' + e.message));

  let heartbeatTimer = null;
  let reconnectAttempt = 0;

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      // App-level heartbeat: keeps the socket warm through NATs/sleep cycles
      if (wsOpen && ws.readyState === WebSocket.OPEN) {
        try { ws.send(JSON.stringify({ v: PROTO_VER, type: 'ping', sid: SESSION_ID })); } catch {}
      }
    }, 20000);
  }
  function stopHeartbeat() { clearInterval(heartbeatTimer); heartbeatTimer = null; }

  function relayConnect() {
    if (!networkId) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

    setStatus('Connecting', 'off');
    const url = `${RELAY_URL}/room/${networkId}`;
    dbg('relay=' + RELAY_URL);
    dbg('room=' + networkId + ' ua=' + navigator.userAgent.slice(0, 36));
    dbg('WS-> ' + url);
    try { ws = new WebSocket(url); }
    catch (e) { dbg('WS ctor fail: ' + e.message); scheduleReconnect(); return; }

    ws.onopen = () => {
      wsOpen = true;
      reconnectAttempt = 0;
      setStatus('Online', 'online');
      dbg('WS OPEN');
      startHeartbeat();
      ws.send(JSON.stringify({ v: PROTO_VER, type: 'join', sid: SESSION_ID, name: deviceName, kind: deviceKind }));
    };

    ws.onmessage = e => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      if (!msg || msg.v !== PROTO_VER) return;
      if (msg.type === 'peers') syncPeers(msg.peers || []);
      else if (msg.type === 'signal') handleSignal(msg).catch(err => log(`Signal error: ${err.message}`, 'error'));
      // ping frames are answered by the DO auto-response; nothing to do
    };

    ws.onclose = e => {
      wsOpen = false;
      stopHeartbeat();
      dbg(`WS CLOSE code=${e.code} reason=${e.reason || '-'} clean=${e.wasClean}`);
      scheduleReconnect();
    };
    ws.onerror = () => { dbg('WS ERROR'); try { ws.close(); } catch {} };
  }

  function scheduleReconnect() {
    setStatus('Reconnecting', 'off');
    clearTimeout(reconnectTimer);
    // exponential backoff capped at 10s, gentler on mobile battery + flaky NAT
    const delay = Math.min(10000, 600 * Math.pow(1.7, reconnectAttempt));
    reconnectAttempt++;
    reconnectTimer = setTimeout(relayConnect, delay);
  }

  // Mobile browsers kill sockets on background/rotate/network flap; reconnect on resume
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) relayConnect();
  });
  window.addEventListener('online', relayConnect);
  window.addEventListener('focus', relayConnect);

  function relaySend(obj) {
    if (wsOpen && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  function signal(toSid, payload) {
    relaySend({ v: PROTO_VER, type: 'signal', sid: SESSION_ID, to: toSid, payload });
  }

  // ---------- Peer roster ----------
  function syncPeers(roster) {
    const seen = new Set();
    for (const p of roster) {
      if (p.sid === SESSION_ID) continue;
      seen.add(p.sid);
      if (!peers.has(p.sid)) {
        peers.set(p.sid, p);
        renderPeer(p);
      } else if (peers.get(p.sid).name !== p.name) {
        peers.get(p.sid).name = p.name;
        const el = document.querySelector(`#peer-${CSS.escape(p.sid)} .peer-name`);
        if (el) el.textContent = p.name;
      }
    }
    for (const sid of [...peers.keys()]) {
      // A relay reconnect can briefly return a partial roster. Never tear
      // down an established WebRTC link because signaling is momentarily
      // unavailable.
      if (!seen.has(sid) && sid !== activePeer) removePeer(sid);
    }
    refreshPeerUI();
    if (qrTargetSid && !qrConnectionStarted && peers.has(qrTargetSid)) {
      qrConnectionStarted = true;
      requestConnection(qrTargetSid, true, qrPairToken);
      log('QR target found — requesting direct connection', 'success');
    }
  }

  function removePeer(sid) {
    if (!peers.has(sid)) return;
    peers.delete(sid);
    document.getElementById(`peer-${sid}`)?.remove();
    if (activePeer === sid) teardownConnection('Device left the network');
    refreshPeerUI();
  }

  function renderPeer(peer) {
    const btn = document.createElement('button');
    btn.id = `peer-${peer.sid}`;
    btn.className = 'group flex animate-slide-up flex-col items-center gap-2.5 rounded-md border border-border bg-background/50 p-4 text-center transition-colors hover:border-muted-foreground/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
    btn.onclick = () => requestConnection(peer.sid);
    btn.innerHTML = peerMarkup(peer);
    document.getElementById('peerGrid').appendChild(btn);
    lucide.createIcons();
  }

  function peerMarkup(peer) {
    const connected = activePeer === peer.sid;
    return `
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <i data-lucide="${iconFor(peer.kind)}" class="h-5 w-5"></i>
      </div>
      <span class="peer-name w-full truncate text-xs font-medium">${esc(peer.name)}</span>
      <span class="-mt-1.5 text-[10px] font-medium uppercase tracking-wider ${connected ? 'text-success' : 'text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100'}">${connected ? 'connected' : 'connect'}</span>`;
  }

  function refreshPeerUI() {
    const n = peers.size;
    document.getElementById('emptyState').classList.toggle('hidden', n > 0);
    document.getElementById('peerGrid').classList.toggle('hidden', n === 0);
    document.getElementById('peerCount').innerText = `${n} nearby`;
    for (const peer of peers.values()) {
      const el = document.getElementById(`peer-${peer.sid}`);
      if (!el) continue;
      el.innerHTML = peerMarkup(peer);
      el.classList.toggle('border-success/60', activePeer === peer.sid);
    }
    lucide.createIcons();
  }

  // ---------- WebRTC ----------
  async function requestConnection(sid, automatic = false, pairToken = null) {
    if (activePeer === sid) {
      const peer = peers.get(sid);
      const reconnect = await requestConfirmation(
        `Already connected to ${peer ? peer.name : 'this device'}`,
        'Reconnect and replace the current connection?',
        'Reconnect',
        true
      );
      if (!reconnect) return;
    }
    if (activePeer === sid) teardownConnection(null, true);
    if (pc) teardownConnection(null, true);
    pendingPeer = sid;
    setStatus('Requesting', 'busy');
    buildPeerConnection(true);
    signal(sid, { t: 'connect-request', automatic, pairToken });
    const p = peers.get(sid);
    log(`Requesting link with ${p ? p.name : 'device'}…`);
  }

  function buildPeerConnection(initiator) {
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    channels = [];
    if (initiator) {
      for (let i = 0; i < NUM_CHANNELS; i++) {
        const ch = pc.createDataChannel(`ch-${i}`, { ordered: false });
        ch.binaryType = 'arraybuffer';
        wireChannel(ch, i);
        channels.push(ch);
      }
    } else {
      pc.ondatachannel = e => {
        const ch = e.channel;
        ch.binaryType = 'arraybuffer';
        wireChannel(ch, channels.length);
        channels.push(ch);
      };
    }
    pc.onicecandidate = e => {
      if (e.candidate && pendingPeer) signal(pendingPeer, { t: 'ice', c: e.candidate.toJSON() });
    };
    const connection = pc;
    pc.onconnectionstatechange = () => {
      if (pc !== connection) return;
      if (['failed', 'disconnected', 'closed'].includes(connection.connectionState)) {
        notifyPeerDisconnect();
        teardownConnection('Link dropped');
      } else if (connection.connectionState === 'connected') {
        clearTimeout(peerDisconnectTimer);
        peerDisconnectTimer = null;
      }
    };
  }

  function wireChannel(ch, idx) {
    ch.onopen = () => {
      ch.bufferedAmountLowThreshold = BUFFER_LOW;
      if (!activePeer && pendingPeer) {
        activePeer = pendingPeer;
        const p = peers.get(activePeer);
        setStatus('Connected', 'online');
        refreshPeerUI();
        const sec = document.getElementById('transferSection');
        sec.classList.remove('hidden');
        sec.classList.add('grid');
        document.getElementById('sendTargetName').innerText = p ? p.name : 'device';
        document.getElementById('disconnectTargetName').innerText = p ? p.name : 'device';
        if (stagedFiles.length) renderStagedQueue();
        log(`Secure wire open with ${p ? p.name : 'device'}`, 'success');
        sec.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    ch.onmessage = e => handleIncomingChunk(e.data);
  }

  async function waitIceComplete() {
    if (!pc || pc.iceGatheringState === 'complete') return;
    await new Promise(resolve => {
      const done = () => { pc.removeEventListener('icegatheringstatechange', check); resolve(); };
      const check = () => { if (pc.iceGatheringState === 'complete') done(); };
      pc.addEventListener('icegatheringstatechange', check);
      setTimeout(done, 1200);
    });
  }

  async function handleSignal(msg) {
    const from = msg.from;
    const d = msg.payload || {};
    switch (d.t) {
      case 'connect-request': {
        if (activePeer === from || pendingIncoming) return;
        if (d.automatic && d.pairToken === pairingToken) {
          pendingIncoming = { from, name: msg.name || 'Device' };
          respondIncoming(true);
          return;
        }
        pendingIncoming = { from, name: msg.name || 'Device' };
        document.getElementById('incomingTitle').innerText = `${pendingIncoming.name} wants to send you files`;
        document.getElementById('incomingDialog').showModal();
        return;
      }
      case 'connect-accept': {
        if (pendingPeer !== from || !pc) return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitIceComplete();
        signal(from, { t: 'offer', sdp: pc.localDescription.sdp });
        return;
      }
      case 'connect-decline': {
        if (pendingPeer !== from) return;
        log(`${msg.name || 'Device'} declined`, 'error');
        setStatus('Online', 'online');
        teardownConnection(null, true);
        return;
      }
      case 'offer': {
        if (pendingPeer !== from) { pendingPeer = from; }
        if (!pc) buildPeerConnection(false);
        await pc.setRemoteDescription({ type: 'offer', sdp: d.sdp });
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await waitIceComplete();
        signal(from, { t: 'answer', sdp: pc.localDescription.sdp });
        return;
      }
      case 'answer': {
        if (!pc || pc.signalingState !== 'have-local-offer') return;
        await pc.setRemoteDescription({ type: 'answer', sdp: d.sdp });
        return;
      }
      case 'ice': {
        if (!pc || !d.c) return;
        try { await pc.addIceCandidate(d.c); } catch { /* stale */ }
        return;
      }
      case 'hangup': {
        teardownConnection(`${msg.name || 'Device'} disconnected`);
        return;
      }
    }
  }

  function respondIncoming(accepted) {
    const dialog = document.getElementById('incomingDialog');
    if (dialog.open) dialog.close();
    if (!pendingIncoming) return;
    const { from, name } = pendingIncoming;
    pendingIncoming = null;
    if (!accepted) { signal(from, { t: 'connect-decline' }); return; }
    if (pc) teardownConnection(null, true);
    pendingPeer = from;
    setStatus('Pairing', 'busy');
    buildPeerConnection(false);
    signal(from, { t: 'connect-accept' });
    log(`Accepted link from ${name}`);
  }

  async function disconnectPeer() {
    if (!activePeer) return;
    const peer = peers.get(activePeer);
    const confirmed = await requestConfirmation(
      `Disconnect from ${peer ? peer.name : 'this device'}?`,
      'Any active transfers will stop.',
      'Disconnect',
      true
    );
    if (!confirmed) return;
    notifyPeerDisconnect();
    teardownConnection('Disconnected');
  }

  function notifyPeerDisconnect() {
    if (activePeer) signal(activePeer, { t: 'hangup' });
  }

  function requestConfirmation(title, description, actionLabel, destructive = false) {
    if (pendingConfirmation) pendingConfirmation.resolve(false);
    const dialog = document.getElementById('confirmDialog');
    const action = document.getElementById('confirmActionButton');
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmDescription').textContent = description;
    action.textContent = actionLabel;
    action.className = `inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`;
    document.getElementById('confirmIcon').innerHTML = `<i data-lucide="${destructive ? 'triangle-alert' : 'circle-help'}" class="h-4 w-4"></i>`;
    lucide.createIcons();
    return new Promise(resolve => {
      pendingConfirmation = { resolve, dialog };
      dialog.showModal();
      action.focus();
    });
  }

  function resolveConfirmation(confirmed) {
    if (!pendingConfirmation) return;
    const { resolve, dialog } = pendingConfirmation;
    pendingConfirmation = null;
    if (dialog.open) dialog.close();
    resolve(confirmed);
  }

  function teardownConnection(reason, silent) {
    transferGeneration++;
    clearTimeout(peerDisconnectTimer);
    peerDisconnectTimer = null;
    if (pc) { try { pc.close(); } catch {} }
    pc = null; channels = []; activePeer = null;
    refreshPeerUI();
    for (const transfer of receiveTransfers.values()) {
      discardReceiveTransfer(transfer);
    }
    receiveTransfers.clear();
    for (const transfer of sendTransfers.values()) {
      if (transfer.status === 'active' || transfer.status === 'queued') transfer.status = 'stopped';
    }
    stagedFiles = [];
    renderStagedQueue();
    renderTransfers();
    if (!silent) {
      pendingPeer = null;
      const sec = document.getElementById('transferSection');
      sec.classList.add('hidden'); sec.classList.remove('grid');
      setStatus('Online', 'online');
      if (reason) log(reason, 'error');
    }
  }

  async function discardReceiveTransfer(transfer) {
    try { if (transfer.writable) await transfer.writable.abort(); } catch {}
    if (transfer.fileHandle) {
      try { (await navigator.storage.getDirectory()).removeEntry(transfer.name); } catch {}
    }
  }

  async function clearStaleOpfsFiles() {
    if (!window.isSecureContext || !navigator.storage?.getDirectory) return;
    try {
      const root = await navigator.storage.getDirectory();
      for await (const entry of root.values()) {
        await root.removeEntry(entry.name, { recursive: entry.kind === 'directory' });
      }
      dbg('OPFS stale transfer files cleared');
    } catch (err) {
      dbg('OPFS cleanup failed: ' + (err.message || err));
      log(`Could not clear stale local transfer files: ${err.message || err}`, 'error');
    }
  }

  // ---------- File transfer (OPFS direct-to-disk) ----------
  async function handleIncomingChunk(data) {
    if (typeof data === 'string') {
      const msg = JSON.parse(data);
      if (msg.type === 'START') {
        const id = String(msg.transferId);
        if (receiveTransfers.has(id)) return;
        const now = performance.now();
        const transfer = { id, direction: 'receive', name: msg.name, size: msg.size, progress: 0, speed: 0, startedAt: now, lastSampleTime: now, lastSampleBytes: 0, lastRenderTime: 0, status: 'active', writable: null, fileHandle: null, pending: [], endReceived: false, initializing: true };
        receiveTransfers.set(id, transfer);
        renderTransfers();
        log(`Inbound: ${msg.name} (${fmtMB(msg.size)})`);
        try {
          if (!window.isSecureContext || !navigator.storage?.getDirectory) {
            throw new Error('HTTPS required for disk streaming.');
          }
          const root = await navigator.storage.getDirectory();
          transfer.fileHandle = await root.getFileHandle(msg.name, { create: true });
          transfer.writable = await transfer.fileHandle.createWritable({ keepExistingData: false });
          sendTransferControl('READY', id);
          for (const chunk of transfer.pending.splice(0)) {
            await transfer.writable.write({ type: 'write', position: chunk.offset, data: chunk.payload });
          }
          transfer.initializing = false;
          if (transfer.endReceived) await finishIncomingTransfer(transfer);
        } catch (err) {
          transfer.status = 'error';
          renderTransfers();
          log(err.message, 'error');
        }
      } else if (msg.type === 'END') {
        const transfer = receiveTransfers.get(String(msg.transferId));
        if (!transfer) return;
        transfer.endReceived = true;
        if (transfer.writable && !transfer.initializing) await finishIncomingTransfer(transfer);
      } else if (msg.type === 'CANCEL') {
        const transfer = receiveTransfers.get(String(msg.transferId));
        if (!transfer) return;
        transfer.status = 'stopped';
        await discardReceiveTransfer(transfer);
        renderTransfers();
        log(`Stopped: ${transfer.name}`, 'error');
      } else if (msg.type === 'READY' || msg.type === 'REJECT') {
        const transfer = sendTransfers.get(String(msg.transferId));
        if (!transfer || transfer.permissionResolved) return;
        transfer.permissionResolved = true;
        if (msg.type === 'READY') transfer.resolvePermission?.(true);
        else {
          transfer.cancelled = true;
          transfer.status = 'stopped';
          transfer.resolvePermission?.(false);
          renderTransfers();
        }
      }
      return;
    }
    const view = new DataView(data, 0, 12);
    const id = String(view.getUint32(0, true));
    const offset = Number(view.getBigUint64(4, true));
    const payload = data.slice(12);
    const transfer = receiveTransfers.get(id);
    if (!transfer || transfer.status !== 'active') return;
    if (transfer.writable) {
      await transfer.writable.write({ type: 'write', position: offset, data: payload });
    } else {
      transfer.pending.push({ offset, payload });
    }
    updateTransferTelemetry(receiveTransfers, id, transfer.progress + payload.byteLength);
    if (transfer.endReceived && transfer.progress === transfer.size && !transfer.initializing) {
      await finishIncomingTransfer(transfer);
    }
  }

  async function finishIncomingTransfer(transfer) {
    if (receiveTransfers.get(transfer.id) !== transfer) return;
    if (!transfer.writable || transfer.status === 'complete') return;
    if (transfer.progress !== transfer.size) return;
    await transfer.writable.close();
    transfer.writable = null;
    const file = await transfer.fileHandle.getFile();
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url; a.download = transfer.name;
    document.body.appendChild(a); a.click(); a.remove();
    const name = transfer.name;
    setTimeout(async () => {
      URL.revokeObjectURL(url);
      try { (await navigator.storage.getDirectory()).removeEntry(name); } catch {}
    }, 30000);
    transfer.progress = transfer.size;
    transfer.status = 'complete';
    finalizeTransferTelemetry(transfer);
    renderTransfers();
    log(`Saved: ${transfer.name}`, 'success');
    if (navigator.vibrate) navigator.vibrate(40);
  }

  async function transmitQueue() {
    const open = channels.filter(c => c.readyState === 'open');
    if (transmitRunning || !open.length || !stagedFiles.length) return;
    const queue = stagedFiles.slice();
    const totalSize = queue.reduce((sum, file) => sum + file.size, 0);
    const fileLabel = queue.length === 1 ? 'file' : 'files';
    const confirmed = await requestConfirmation(
      `Add ${queue.length} ${fileLabel} to the send queue?`,
      `Total size: ${fmtMB(totalSize)}\n\nFiles will be transferred one after another.`,
      'Add to queue'
    );
    if (!confirmed) return;
    transmitRunning = true;
    const generation = transferGeneration;

    const transferQueue = queue.map(file => {
      const id = String(nextTransferId++);
      const transfer = { id, direction: 'send', name: file.name, size: file.size, progress: 0, speed: 0, startedAt: 0, lastSampleTime: 0, lastSampleBytes: 0, lastRenderTime: 0, status: 'queued' };
      sendTransfers.set(id, transfer);
      return { file, id, transfer };
    });
    renderTransfers();

    for (const { file, id, transfer } of transferQueue) {
      if (transfer.cancelled) continue;
      if (generation !== transferGeneration || !activePeer) {
        transmitRunning = false;
        return;
      }
      transfer.status = 'active';
      transfer.startedAt = performance.now();
      transfer.lastSampleTime = transfer.startedAt;
      transfer.lastRenderTime = 0;
      transfer.permissionResolved = false;
      transfer.permissionPromise = new Promise(resolve => { transfer.resolvePermission = resolve; });
      renderTransfers();
      const startMessage = JSON.stringify({ type: 'START', transferId: id, name: file.name, size: file.size });
      open.forEach(ch => { try { ch.send(startMessage); } catch {} });
      const permitted = await Promise.race([
        transfer.permissionPromise,
        new Promise(resolve => setTimeout(() => resolve(false), 30000)),
      ]);
      if (!permitted || transfer.cancelled) {
        transfer.status = 'stopped';
        renderTransfers();
        continue;
      }
      let offset = 0, i = 0;
      const reader = file.stream().getReader();

      while (true) {
        if (transfer.cancelled) {
          await reader.cancel();
          break;
        }
        if (generation !== transferGeneration || !activePeer) {
          transmitRunning = false;
          return;
        }
        const { done, value } = await reader.read();
        if (done) break;
        for (let s = 0; s < value.byteLength; s += CHUNK_SIZE) {
          if (transfer.cancelled) break;
          if (generation !== transferGeneration || !activePeer) {
            await reader.cancel();
            transmitRunning = false;
            return;
          }
          const ch = open[i % open.length];
          if (ch.bufferedAmount > BUFFER_HIGH) {
            await new Promise(resolve => {
              let settled = false;
              const finish = () => { if (settled) return; settled = true; ch.removeEventListener('bufferedamountlow', onLow); clearInterval(iv); resolve(); };
              const onLow = () => finish();
              ch.addEventListener('bufferedamountlow', onLow);
              const iv = setInterval(() => { if (ch.bufferedAmount <= BUFFER_LOW) finish(); }, 8);
            });
          }
          const len = Math.min(CHUNK_SIZE, value.byteLength - s);
          const packet = new Uint8Array(12 + len);
          const header = new DataView(packet.buffer);
          header.setUint32(0, Number(id), true);
          header.setBigUint64(4, BigInt(offset), true);
          packet.set(value.subarray(s, s + len), 12);
          try { ch.send(packet.buffer); }
          catch {
            await new Promise(r => setTimeout(r, 15));
            if (generation !== transferGeneration || !activePeer) {
              await reader.cancel();
              transmitRunning = false;
              return;
            }
            try { ch.send(packet.buffer); }
            catch {
              transfer.status = 'stopped';
              transmitRunning = false;
              return;
            }
            if (transfer.cancelled) break;
          }
          if (transfer.cancelled) {
            renderTransfers();
            break;
          }
          offset += len; i++;
          updateTransferTelemetry(sendTransfers, id, offset);
        }
      }
      if (transfer.cancelled) {
        const cancelMessage = JSON.stringify({ type: 'CANCEL', transferId: id });
        open.forEach(ch => { try { ch.send(cancelMessage); } catch {} });
        transfer.status = 'stopped';
        renderTransfers();
        continue;
      }
      const endMessage = JSON.stringify({ type: 'END', transferId: id });
      open.forEach(ch => { try { ch.send(endMessage); } catch {} });
      updateTransfer(sendTransfers, id, { progress: file.size, status: 'complete' });
      finalizeTransferTelemetry(transfer);
      renderTransfers();
      log(`Sent: ${file.name}`, 'success');
    }

    stagedFiles = stagedFiles.slice(queue.length);
    renderStagedQueue();
    transmitRunning = false;
    if (stagedFiles.length) setTimeout(transmitQueue, 0);
  }

  function renderStagedQueue() {
    document.getElementById('stagedFilesList').innerHTML = stagedFiles.map((f, index) => `
      <div class="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-xs">
        <span class="flex min-w-0 items-center gap-2">
          <i data-lucide="file" class="h-3.5 w-3.5 shrink-0 text-muted-foreground"></i>
          <span class="truncate font-medium">${esc(f.name)}</span>
        </span>
        <span class="ml-2 flex shrink-0 items-center gap-2 text-muted-foreground">
          <span class="tabular-nums">${fmtMB(f.size)}</span>
          <button type="button" onclick="removeStagedFile(${index})" class="rounded px-1 text-[10px] hover:bg-destructive/10 hover:text-red-400" title="Remove from queue">Remove</button>
        </span>
      </div>`).join('');
    lucide.createIcons();
    document.getElementById('stagedContainer').classList.toggle('hidden', stagedFiles.length === 0);
  }
  function removeStagedFile(index) {
    if (index < 0 || index >= stagedFiles.length) return;
    stagedFiles.splice(index, 1);
    renderStagedQueue();
  }

  // ---------- UI wiring ----------
  function renameSelf() {
    const name = prompt('Device name shown to others:', deviceName);
    if (!name || !name.trim()) return;
    deviceName = name.trim().slice(0, 32);
    localStorage.setItem('airlocal.name', deviceName);
    document.getElementById('selfName').textContent = deviceName;
    relaySend({ v: PROTO_VER, type: 'join', sid: SESSION_ID, name: deviceName, kind: deviceKind });
  }

  function setupDropZone() {
    const dz = document.getElementById('dropZone');
    const fi = document.getElementById('fileInput');
    dz.addEventListener('click', () => fi.click());
    dz.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fi.click(); } });
    fi.onchange = e => stageFiles(Array.from(e.target.files));
    ['dragover', 'dragleave', 'drop'].forEach(evt => {
      dz.addEventListener(evt, e => {
        e.preventDefault();
        dz.classList.toggle('border-muted-foreground/60', evt === 'dragover');
        dz.classList.toggle('bg-accent/60', evt === 'dragover');
        if (evt === 'drop') stageFiles(Array.from(e.dataTransfer.files));
      });
    });
  }

  function stageFiles(files) {
    if (!files.length) return;
    const queuedPaths = new Set(stagedFiles.map(filePath));
    const additions = [];
    for (const file of files) {
      const path = filePath(file);
      if (queuedPaths.has(path)) {
        log(`Already added to send queue: ${path}`, 'error');
        continue;
      }
      queuedPaths.add(path);
      additions.push(file);
    }
    stagedFiles = [...stagedFiles, ...additions];
    renderStagedQueue();
  }

  // ---------- Boot ----------
  window.addEventListener('DOMContentLoaded', async () => {
    await clearStaleOpfsFiles();
    lucide.createIcons();
    document.getElementById('confirmDialog').addEventListener('close', () => {
      if (!pendingConfirmation) return;
      const { resolve } = pendingConfirmation;
      pendingConfirmation = null;
      resolve(false);
    });
    // triple-tap header toggles the diagnostic overlay (for phones)
    let tapCount = 0, tapTimer = null;
    document.querySelector('header').addEventListener('click', () => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => tapCount = 0, 500);
      if (tapCount >= 3) {
        tapCount = 0;
        const el = document.getElementById('dbgOverlay');
        el.classList.toggle('hidden');
        if (!el.classList.contains('hidden')) el.textContent = (window.__dbg || []).join('\n') || 'no events yet';
      }
    });
    if (!deviceName) {
      deviceName = randomName();
      localStorage.setItem('airlocal.name', deviceName);
    }
    document.getElementById('selfName').textContent = deviceName;
    document.getElementById('selfAvatar').innerHTML = `<i data-lucide="${iconFor(deviceKind)}" class="h-4 w-4"></i>`;
    lucide.createIcons();
    setupDropZone();

    qrTargetSid = sanitizeSid(new URLSearchParams(location.search).get('device'));
    qrPairToken = new URLSearchParams(location.search).get('pair');
    if (qrTargetSid === SESSION_ID) qrTargetSid = null;
    networkId = getRoom();
    document.getElementById('networkLabel').textContent = networkId;
    document.getElementById('selfRoomHint').textContent = networkId;
    renderQr();
    dbg('room = ' + networkId);
    relayConnect();
  });

  window.addEventListener('pagehide', () => {
    if (activePeer) signal(activePeer, { t: 'hangup' });
    relaySend({ v: PROTO_VER, type: 'leave', sid: SESSION_ID });
  });
