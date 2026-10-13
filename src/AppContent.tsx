import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Dialog } from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Checkbox } from "./components/ui/switch";

export function AppContent() {
  return (
    <Card className="contents">
      <>
  {/* ── Header ─────────────────────────────────────────── */}
  <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container flex h-14 items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <i data-lucide="arrow-left-right" className="h-3.5 w-3.5 stroke-[2.5]"></i>
        </div>
        <span className="text-sm font-semibold tracking-tight">AirLocal</span>
      </div>
      <div className="flex items-center gap-2">
        <nav className="hidden items-center gap-1 text-xs font-medium text-muted-foreground sm:flex" aria-label="Information">
          <a href="#how-it-works" className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-foreground">How it works</a>
          <a href="#citations" className="rounded-md px-2.5 py-1.5 transition-colors hover:bg-accent hover:text-foreground">Citations</a>
        </nav>
        <Button onClick={() => { (window as any).toggleSettings() }} aria-label="Open settings" title="Settings" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <i data-lucide="settings-2" className="h-4 w-4"></i>
        </Button>
        <a href="https://github.com/pulkitpareek18/AIR-LOCAL" target="_blank" rel="noopener noreferrer" aria-label="View AirLocal on GitHub" title="View source on GitHub" className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
            <path d="M12 .7a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.4-5.5-6a4.7 4.7 0 0 1 1.2-3.3c-.1-.3-.5-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.9.1 3.2a4.7 4.7 0 0 1 1.2 3.3c0 4.6-2.8 5.7-5.5 6 .4.3.8 1 .8 2v2.9c0 .3.2.7.8.6A12 12 0 0 0 12 .7Z"/>
          </svg>
        </a>
        <div id="connectionBadge" className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium" aria-live="polite">
          <span className="relative flex h-2 w-2">
            <span id="statusPing" className="absolute inline-flex h-full w-full rounded-full bg-zinc-500 opacity-75 animate-ping"></span>
            <span id="statusDot" className="relative inline-flex h-2 w-2 rounded-full bg-zinc-500"></span>
          </span>
          <span id="statusText" className="text-muted-foreground">Connecting</span>
          <span className="hidden h-3.5 w-px bg-border sm:block" aria-hidden="true"></span>
          <span id="networkMode" className="hidden text-muted-foreground sm:inline" title="AirLocal transfers files directly between the connected browsers">Discovery</span>
        </div>
      </div>
    </div>
  </header>

  <main id="appMain" className="container flex-1 flex flex-col gap-4 py-6">
    <div id="reconnectBanner" className="hidden items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm" role="status">
      <div className="flex min-w-0 items-start gap-2.5">
        <i data-lucide="wifi-off" className="mt-0.5 h-4 w-4 shrink-0 text-warning"></i>
        <div className="min-w-0">
          <p className="font-medium">Connection lost</p>
          <p className="mt-0.5 text-xs text-muted-foreground">The active transfer was canceled. Your remaining queued files are still here.</p>
        </div>
        <div id="compatibilityBanner" className="hidden rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
          <p className="font-medium text-destructive">This browser is not fully supported</p>
          <p id="compatibilityDetails" className="mt-1 text-xs text-muted-foreground"></p>
        </div>
      </div>
      <button onClick={() => { (window as any).retryConnection() }} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <i data-lucide="refresh-cw" className="h-3.5 w-3.5"></i> Reconnect
      </button>
    </div>
    <section id="onboardingCard" className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold">Send files directly between your devices</p>
          <p className="mt-1 text-xs text-muted-foreground">No uploads, accounts, or file storage on a server.</p>
        </div>
        <button onClick={() => { (window as any).dismissOnboarding() }} aria-label="Dismiss introduction" className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <i data-lucide="x" className="h-4 w-4"></i>
        </button>
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        <div className="mb-4 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-foreground">
          <i data-lucide="wifi" className="mt-0.5 h-4 w-4 shrink-0 text-primary"></i>
          <span><span className="font-medium">Keep both devices on the same local network.</span> Use the same Wi-Fi, a phone hotspot, or a LAN/Ethernet connection. Files stay on that local connection, so they do not use your internet data.</span>
        </div>
        <div className="flex gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">1</span>
          <span>Scan the QR code using your phone camera to connect and share files.</span>
        </div>
        <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
          <span className="h-px flex-1 bg-border"></span>
          <span>OR</span>
          <span className="h-px flex-1 bg-border"></span>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
          <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">1</span><span>Open AirLocal.</span></div>
          <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">2</span><span>Enter the room code.</span></div>
          <div className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-foreground">3</span><span>Connect and share files.</span></div>
        </div>
      </div>
    </section>

    {/* ── Identity + pair card ─────────────────────────── */}
    <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <i data-lucide="qr-code" className="h-4 w-4 text-muted-foreground"></i>
          <h3 className="text-sm font-semibold leading-none tracking-tight">This device</h3>
        </div>
        <span id="discoveryState" className="text-xs font-medium text-warning">connecting</span>
      </div>
      <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5 min-w-0">
          <div id="selfAvatar" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
            <i data-lucide="smartphone" className="h-5 w-5"></i>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p id="selfName" className="text-sm font-medium leading-tight truncate">…</p>
              <button onClick={() => { (window as any).renameSelf() }} className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" title="Rename device">
                <i data-lucide="pencil" className="h-3 w-3"></i>
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">Pair by QR or room code</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="rounded-md bg-zinc-100 p-2 ring-1 ring-border">
            <div id="qrBox" className="[&>img]:block [&>canvas]:block"></div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Room code</p>
            <p id="selfRoomHint" className="mt-1 font-mono text-3xl font-semibold tabular-nums tracking-[0.2em]">----</p>
            <button onClick={() => { (window as any).editRoom() }} className="mt-2 inline-flex h-7 items-center gap-1 rounded-md border border-input bg-background px-2.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground">
              <i data-lucide="pencil" className="h-3 w-3"></i> Change
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-5 py-2.5 text-center text-xs text-muted-foreground">
        Keep both devices on the same local network: shared Wi-Fi, a phone hotspot, or LAN/Ethernet. Files use the local connection, not your internet data.
      </div>
    </section>

    {/* ── Nearby devices ───────────────────────────────── */}
    <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <i data-lucide="radar" className="h-4 w-4 text-muted-foreground"></i>
          <h3 className="text-sm font-semibold leading-none tracking-tight">Nearby devices</h3>
        </div>
        <Badge id="peerCount" className="border-border bg-secondary text-secondary-foreground">0 nearby</Badge>
      </div>
      <div className="p-5">
        <div id="emptyState" className="flex flex-col items-center justify-center rounded-md border border-dashed border-border py-12 text-center" aria-live="polite">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary ring-pulse">
            <i data-lucide="loader-circle" className="h-5 w-5 animate-spin text-muted-foreground"></i>
          </div>
          <p id="emptyStateTitle" className="mt-4 text-sm font-medium">Looking for devices…</p>
          <p id="emptyStateDescription" className="mt-1 max-w-[280px] text-xs text-muted-foreground">Scan the QR code to connect, or open AirLocal and enter this room's 4-digit code.</p>
        </div>
        <div id="peerGrid" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"></div>
      </div>
    </section>

    {/* ── Transfer panel ───────────────────────────────── */}
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-3 text-card-foreground shadow-sm">
      <div className="flex min-w-0 items-start gap-3">
        <i data-lucide="folder-down" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"></i>
        <div className="min-w-0">
          <p className="text-xs font-medium">Received files are stored in</p>
          <button type="button" onClick={() => { (window as any).openSelectedFolder() }} id="mainSaveLocationName" className="mt-0.5 block max-w-full truncate text-left text-sm font-semibold underline decoration-dotted underline-offset-2 hover:text-primary">Browser Downloads</button>
          <p id="mainSaveLocationPath" className="mt-1 break-all font-mono text-[10px] text-muted-foreground">Browser Downloads</p>
          <p id="mainSaveLocationDescription" className="mt-0.5 text-[11px] text-muted-foreground">Files will use your browser download folder.</p>
        </div>
      </div>
      <button onClick={() => { (window as any).manageSaveLocation() }} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <i data-lucide="settings-2" className="h-3.5 w-3.5"></i>
        <span className="hidden sm:inline">Manage</span>
      </button>
    </div>

    <section id="transferSection" className="hidden grid-cols-1 gap-4 md:grid-cols-2">

      <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <i data-lucide="send-horizontal" className="h-4 w-4 text-muted-foreground"></i>
            <h3 className="text-sm font-semibold leading-none tracking-tight">Send files</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">Direct transfer</span>
        </div>
        <div className="p-5">
          <div id="dropZone" className="group cursor-pointer rounded-md border border-dashed border-border bg-background/50 p-8 text-center transition-colors hover:border-muted-foreground/50 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="button" aria-label="Select files to send">
            <input type="file" id="fileInput" className="hidden" multiple />
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors group-hover:text-foreground">
              <i data-lucide="file-up" className="h-4 w-4"></i>
            </div>
            <p className="mt-3 text-sm font-medium">Choose files or drop them here</p>
          </div>

          <div id="stagedContainer" className="mt-4 hidden">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Send queue</p>
              <span id="queueSummary" className="text-[10px] tabular-nums text-muted-foreground">0 files · 0 MB</span>
            </div>
            <div id="stagedFilesList" className="mb-3 max-h-32 space-y-1.5 overflow-y-auto custom-scrollbar"></div>
            <div className="flex gap-2">
              <button id="sendBtn" onClick={() => { (window as any).transmitQueue() }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                <i data-lucide="zap" className="h-3.5 w-3.5 fill-current"></i>
                <span id="sendBtnLabel">Send to <span id="sendTargetName">device</span></span>
              </button>
              <button id="clearQueueBtn" onClick={() => { (window as any).clearStagedQueue() }} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" title="Clear send queue">
                <i data-lucide="trash-2" className="h-3.5 w-3.5"></i><span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <i data-lucide="activity" className="h-4 w-4 text-muted-foreground"></i>
            <h3 className="text-sm font-semibold leading-none tracking-tight">Activity</h3>
          </div>
          <span id="speedValue" title="Measured transfer speed, not maximum network speed" className="text-sm font-semibold tabular-nums">0.0 MB/s</span>
        </div>
        <div className="p-5">
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sent</p>
                <span id="sentCount" className="text-[10px] tabular-nums text-muted-foreground">0</span>
              </div>
              <div id="sentTransfers" className="space-y-2"></div>
              <p id="sentEmpty" className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">Completed and active sent transfers will appear here.</p>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Received</p>
                <span id="receivedCount" className="text-[10px] tabular-nums text-muted-foreground">0</span>
              </div>
              <div id="receivedTransfers" className="space-y-2"></div>
              <p id="receivedEmpty" className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">Received files will appear here.</p>
            </div>
          </div>

          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Log</p>
          <div id="eventLogs" className="min-h-[110px] max-h-[140px] space-y-1 overflow-y-auto rounded-md border border-border bg-background/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground custom-scrollbar" aria-live="polite"></div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-5 py-3 text-card-foreground shadow-sm md:col-span-2">
        <div>
          <p className="text-xs font-medium">Connected to <span id="disconnectTargetName">device</span></p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Disconnecting stops active transfers on both devices.</p>
        </div>
        <button onClick={() => { (window as any).disconnectPeer() }} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <i data-lucide="unplug" className="h-3.5 w-3.5"></i>
          Disconnect
        </button>
      </div>
    </section>

    <footer className="mt-auto pb-2 pt-4 text-center text-xs text-muted-foreground">
      <p className="mx-auto max-w-2xl leading-5">Files move directly between your devices over an encrypted local connection.</p>
      <p className="mx-auto max-w-2xl leading-5">AirLocal never uploads, stores, or inspects them.</p>
      <p className="mt-3">Made in India <span aria-label="Indian flag" role="img">🇮🇳</span> · Innovating from India, for everyone</p>
      <p className="mt-1 text-foreground"><a href="https://github.com/pulkitpareek18" target="_blank" rel="noopener noreferrer" className="underline decoration-dotted underline-offset-2 transition-colors hover:text-primary">Pulkit Pareek</a></p>
    </footer>

    {/* mobile diagnostic overlay: triple-tap the header to toggle */}
    <pre id="dbgOverlay" className="hidden fixed bottom-0 left-0 right-0 z-50 m-2 max-h-40 overflow-auto rounded-md border border-border bg-popover/95 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground backdrop-blur custom-scrollbar"></pre>
  </main>

  <main id="infoMain" className="container hidden flex-1 py-8 sm:py-12">
    <div className="mx-auto max-w-3xl">
      <a href="#" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <i data-lucide="arrow-left" className="h-3.5 w-3.5"></i>
        Back to AirLocal
      </a>
      <section id="how-it-works" className="mt-6 scroll-mt-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">How it works</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Move files directly between your devices.</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">AirLocal creates a private connection between browsers. The relay helps devices discover each other, then the file data travels directly between the two devices.</p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary"><i data-lucide="scan-line" className="h-4 w-4"></i></div>
            <h2 className="mt-4 text-sm font-semibold">1. Pair</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">For a direct local transfer, keep both devices on the same local network: shared Wi-Fi, a phone hotspot, or LAN/Ethernet. File bytes stay on the local connection, so the transfer does not use your internet data. Then scan the QR code or enter the same room code.</p>
          </article>
          <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary"><i data-lucide="file-up" className="h-4 w-4"></i></div>
            <h2 className="mt-4 text-sm font-semibold">2. Choose</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">Select files or drop them into the send area. AirLocal keeps the transfer in your browser and does not upload the files.</p>
          </article>
          <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary"><i data-lucide="arrow-down-to-line" className="h-4 w-4"></i></div>
            <h2 className="mt-4 text-sm font-semibold">3. Receive</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">The receiving device saves the files to Downloads or to the selected custom folder, including optional backup organization.</p>
          </article>
        </div>
        <div className="mt-8 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <i data-lucide="shield-check" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"></i>
            <div>
              <h2 className="text-sm font-semibold">What the relay does</h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">The Cloudflare relay coordinates room presence and WebRTC signaling only. It does not receive, store, or inspect transferred file contents. If a direct browser connection cannot be established, AirLocal does not silently upload files to the relay.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="citations" className="mt-16 scroll-mt-24 border-t border-border pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Citations</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Technical references.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">A numbered bibliography for the protocols, browser APIs, libraries, and deployment services used by AirLocal. Links point to primary specifications, official documentation, or original project source.</p>
        <p className="mt-3 text-[11px] text-muted-foreground">References verified for this release · 13 October 2026</p>
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Communication and transport</h2>
            <ol className="mt-3 space-y-3">
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://www.w3.org/TR/webrtc/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[1] W3C, “WebRTC 1.0: Real-Time Communication Between Browsers.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Browser connection and data transport model.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[2] MDN Web Docs, “RTCDataChannel.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Data channels used for file chunks and transfer controls.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://www.rfc-editor.org/rfc/rfc8445" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[3] IETF RFC 8445, “Interactive Connectivity Establishment (ICE).”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Candidate gathering and connectivity checks.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://www.rfc-editor.org/rfc/rfc8489" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[4] IETF RFC 8489, “Session Traversal Utilities for NAT (STUN).”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Network address discovery reference for the configured STUN service.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developer.mozilla.org/en-US/docs/Web/API/WebSocket" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[5] MDN Web Docs, “WebSocket.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Persistent relay connection for presence and signaling.</p></li>
            </ol>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Browser storage and device APIs</h2>
            <ol start={6} className="mt-3 space-y-3">
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developer.mozilla.org/en-US/docs/Web/API/File_System_API" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[6] MDN Web Docs, “File System API.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">User-selected folders, directory handles, and file creation.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://fs.spec.whatwg.org/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[7] WHATWG, “File System Standard.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Normative reference for browser file and directory handles.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developer.mozilla.org/en-US/docs/Web/API/Origin_private_file_system" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[8] MDN Web Docs, “Origin Private File System.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Temporary staging and cleanup of interrupted transfers.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[9] MDN Web Docs, “IndexedDB API.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Persistence for the selected directory handle.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[10] MDN Web Docs, “Network Information API.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Browser-reported Wi-Fi, Ethernet, or cellular categories; frequency bands are not reliably exposed.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[11] MDN Web Docs, “Web Crypto API.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Secure random identifiers for browser sessions.</p></li>
            </ol>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pairing, relay, and presentation</h2>
            <ol start={12} className="mt-3 space-y-3">
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://github.com/davidshimjs/qrcodejs" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[12] David Shim, “QRCode.js.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">QR generation library used for scan-to-connect URLs.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developers.cloudflare.com/durable-objects/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[13] Cloudflare, “Durable Objects Documentation.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Stateful room coordination for discovery and signaling.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://developers.cloudflare.com/durable-objects/api/websockets/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[14] Cloudflare, “WebSockets in Durable Objects.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Relay WebSocket lifecycle and hibernation behavior.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://lucide.dev/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[15] Lucide, “Lucide Icons.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Interface icon library used in the application.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://tailwindcss.com/docs" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[16] Tailwind CSS, “Documentation.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Utility CSS framework used to compile the static interface.</p></li>
            </ol>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Deployment and implementation</h2>
            <ol start={17} className="mt-3 space-y-3">
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://vercel.com/docs/deployments/overview" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[17] Vercel, “Deployments Overview.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Hosting reference for the static frontend and generated assets.</p></li>
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm"><a href="https://github.com/pulkitpareek18/AIR-LOCAL" target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">[18] Pulkit Pareek, “AirLocal Source Repository.”</a><p className="mt-1 text-xs leading-5 text-muted-foreground">Project source, relay implementation, deployment configuration, and release documentation.</p></li>
            </ol>
          </div>
        </div>
        <div className="mt-8 rounded-lg border border-border bg-secondary/30 p-4 text-xs leading-5 text-muted-foreground">
          <p className="font-medium text-foreground">Scope note</p>
          <p className="mt-1">Citations document the technologies and standards used by this application. They do not imply endorsement. Browser support and permission behavior vary by browser, operating system, and privacy settings.</p>
        </div>
      </section>
    </div>
  </main>

  {/* ── Incoming connection dialog (shadcn AlertDialog-styled) ── */}
  <Dialog id="incomingDialog" className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-lg">
    <div className="flex flex-col space-y-2 p-6 text-center sm:text-left">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <i data-lucide="arrow-down-to-line" className="h-4 w-4"></i>
        </div>
        <div>
          <h2 id="incomingTitle" className="text-base font-semibold leading-none tracking-tight">Incoming connection</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Accept to receive files over an encrypted device connection.</p>
        </div>
      </div>
    </div>
    <div className="flex flex-row gap-2 border-t border-border p-4 sm:justify-end">
      <button onClick={() => { (window as any).respondIncoming(false) }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-input px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none sm:px-4">Decline</button>
      <button onClick={() => { (window as any).respondIncoming(true) }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none sm:px-4">Accept</button>
    </div>
  </Dialog>

  <Dialog id="confirmDialog" className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-lg">
    <div className="flex flex-col space-y-2 p-6 text-center sm:text-left">
      <div className="flex items-start gap-3">
        <div id="confirmIcon" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
          <i data-lucide="circle-help" className="h-4 w-4"></i>
        </div>
        <div className="min-w-0">
          <h2 id="confirmTitle" className="text-base font-semibold leading-none tracking-tight">Confirm action</h2>
          <p id="confirmDescription" className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground"></p>
        </div>
      </div>
    </div>
    <div className="flex flex-row gap-2 border-t border-border p-4 sm:justify-end">
      <button type="button" onClick={() => { (window as any).resolveConfirmation(false) }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none sm:px-4">Cancel</button>
      <button id="confirmActionButton" type="button" onClick={() => { (window as any).resolveConfirmation(true) }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none sm:px-4">Confirm</button>
    </div>
  </Dialog>

  <Dialog id="overwriteDialog" className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-lg">
    <div className="p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning"><i data-lucide="file-warning" className="h-4 w-4"></i></div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">File already exists</h2>
          <p className="mt-1.5 text-sm text-muted-foreground"><span id="overwriteFileName" className="font-medium text-foreground"></span> already exists in <span id="overwriteLocation" className="font-medium text-foreground"></span>.</p>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 border-t border-border p-4 sm:grid-cols-4">
      <button type="button" onClick={() => { (window as any).resolveOverwrite('skip') }} className="inline-flex h-9 items-center justify-center rounded-md border border-input px-2 text-xs font-medium hover:bg-accent">Skip</button>
      <button type="button" onClick={() => { (window as any).resolveOverwrite('keep') }} className="inline-flex h-9 items-center justify-center rounded-md border border-input px-2 text-xs font-medium hover:bg-accent">Keep both</button>
      <button type="button" onClick={() => { (window as any).resolveOverwrite('replace') }} className="inline-flex h-9 items-center justify-center rounded-md border border-input px-2 text-xs font-medium hover:bg-accent">Replace</button>
      <button type="button" onClick={() => { (window as any).resolveOverwrite('replace-all') }} className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-2 text-xs font-medium text-primary-foreground hover:bg-primary/90">Replace all</button>
    </div>
  </Dialog>

  <Dialog id="queueNoticeDialog" className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-lg">
    <div className="flex flex-col space-y-2 p-6 text-center sm:text-left">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-warning/15 text-warning">
          <i data-lucide="triangle-alert" className="h-4 w-4"></i>
        </div>
        <div className="min-w-0">
          <h2 id="queueNoticeTitle" className="text-base font-semibold leading-none tracking-tight">Already added to queue</h2>
          <p id="queueNoticeDescription" className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground"></p>
        </div>
      </div>
    </div>
    <div className="flex flex-row gap-2 border-t border-border p-4 sm:justify-end">
      <button type="button" onClick={() => { closeQueueNotice() }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none">OK</button>
    </div>
  </Dialog>

  <Dialog id="settingsDialog" className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-lg">
    <div className="flex items-start justify-between gap-4 border-b border-border p-5">
      <div>
        <h2 className="text-base font-semibold">Settings</h2>
        <p className="mt-1 text-xs text-muted-foreground">Manage your AirLocal experience.</p>
      </div>
      <button type="button" onClick={(event) => { event.preventDefault(); (window as any).closeSettings() }} aria-label="Close settings" className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><i data-lucide="x" className="h-4 w-4"></i></button>
    </div>
    <div className="space-y-2 p-5">
      <button onClick={() => { (window as any).renameSelf(); (window as any).closeSettings() }} className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><i data-lucide="pencil" className="h-4 w-4 text-muted-foreground"></i><span><span className="block font-medium">Rename this device</span><span className="text-xs text-muted-foreground">Choose the name other devices see.</span></span></button>
      <button onClick={() => { (window as any).editRoom(); (window as any).closeSettings() }} className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><i data-lucide="hash" className="h-4 w-4 text-muted-foreground"></i><span><span className="block font-medium">Change room code</span><span className="text-xs text-muted-foreground">Use the same four-digit code on another device.</span></span></button>
      <button onClick={() => { (window as any).clearTransferHistory(); (window as any).closeSettings() }} className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"><i data-lucide="broom" className="h-4 w-4 text-muted-foreground"></i><span><span className="block font-medium">Clear transfer history</span><span className="text-xs text-muted-foreground">Remove completed and stopped activity cards.</span></span></button>
      <div className="rounded-md border border-border p-3">
        <div className="flex items-start gap-3">
          <i data-lucide="folder-down" className="mt-0.5 h-4 w-4 text-muted-foreground"></i>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Save location</p>
            <button type="button" onClick={() => { (window as any).openSelectedFolder() }} id="saveLocationName" className="mt-0.5 block max-w-full truncate text-left text-xs text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-primary">Browser Downloads (fallback)</button>
            <p className="mt-1 text-[10px] text-muted-foreground">Relative folder path</p>
            <p id="saveLocationPath" className="break-all font-mono text-[10px] text-foreground">Browser Downloads</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => { (window as any).chooseSaveDirectory() }} className="inline-flex h-8 items-center rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">Choose folder</button>
              <button onClick={() => { (window as any).clearSaveDirectory() }} className="inline-flex h-8 items-center rounded-md px-2.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">Use Downloads</button>
            </div>
          </div>
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Checkbox id="organizeFiles" type="checkbox" defaultChecked onChange={(event) => (window as any).setOrganizeByType((event.currentTarget as HTMLInputElement).checked)} className="h-3.5 w-3.5 rounded border-input accent-primary" />
          Organize into Images, Videos, Documents, and other folders
        </label>
        <label className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <Checkbox id="backupMode" type="checkbox" disabled onChange={(event) => (window as any).setBackupMode((event.currentTarget as HTMLInputElement).checked)} className="mt-0.5 h-3.5 w-3.5 rounded border-input accent-primary" />
          <span><span className="block font-medium text-foreground">Backup mode</span><span id="backupModeDescription">Choose a save folder first. Each connection then creates a new date-and-time folder so daily backups never overwrite earlier sessions.</span></span>
        </label>
        <label className="mt-3 block border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="block font-medium text-foreground">Backup folder naming</span>
          <span className="mt-1 block">Use tokens: <code>&#123;date&#125;</code>, <code>&#123;time&#125;</code>, <code>&#123;year&#125;</code>, <code>&#123;month&#125;</code>, <code>&#123;day&#125;</code>, <code>&#123;hour&#125;</code>, <code>&#123;minute&#125;</code>, <code>&#123;second&#125;</code>.</span>
          <input id="backupNaming" type="text" defaultValue="{date}/{time}" onChange={(event) => (window as any).setBackupNamingConvention(event.currentTarget.value)} placeholder="{date}/{time}" className="mt-2 h-8 w-full rounded-md border border-input bg-background px-2.5 font-mono text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring" />
          <span className="mt-1 block text-[10px]">Preview: <code id="backupNamingPreview">2026-10-13/09-51-51</code></span>
        </label>
        <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Browsers do not expose the full Finder or File Explorer path. AirLocal shows the selected folder and the exact relative destination used for each received file.</p>
      </div>
      <label className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-3 text-sm">
        <span className="flex items-center gap-3"><i data-lucide="palette" className="h-4 w-4 text-muted-foreground"></i><span><span className="block font-medium">Color theme</span><span className="text-xs text-muted-foreground">Use your device setting or choose a theme.</span></span></span>
        <select id="themeSelect" onChange={(event) => (window as any).setTheme(event.currentTarget.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <option value="device">Device</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </div>
    <div className="border-t border-border px-5 py-4 text-xs leading-relaxed text-muted-foreground">Files are transferred directly between your devices. AirLocal does not upload, store, or inspect your files. The relay only helps devices find and connect to each other.</div>
  </Dialog>

  <Dialog id="inputDialog" className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-lg">
    <div className="p-5">
      <h2 id="inputTitle" className="text-base font-semibold">Edit value</h2>
      <p id="inputDescription" className="mt-1 text-xs text-muted-foreground"></p>
      <Input id="inputValue" className="mt-4 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring" autoComplete="off" />
    </div>
    <div className="flex flex-row gap-2 border-t border-border p-4 sm:justify-end">
      <button type="button" onClick={() => { (window as any).resolveInput(null) }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-md border border-input px-4 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none">Cancel</button>
      <button type="button" onClick={() => { (window as any).resolveInput((document.getElementById('inputValue') as HTMLInputElement).value) }} className="inline-flex h-9 min-w-0 flex-1 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:flex-none">Save</button>
    </div>
  </Dialog>

  <div id="toastRegion" className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-stretch gap-2 sm:left-auto sm:right-4 sm:inset-x-auto sm:w-80" aria-live="polite" aria-atomic="true"></div>


      </>
    </Card>
  );
}
