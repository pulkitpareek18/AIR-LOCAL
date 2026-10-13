  // ================================================================
  //  AirLocal — shadcn-styled, zero-Vercel-backend
  //  Discovery + signaling: Cloudflare Worker Durable Object (WS)
  //  Transfer: WebRTC DataChannels, direct browser connection (4×unordered, 64KB)
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
  const LARGE_QUEUE_FILES = 100;
  const LARGE_FILE_BYTES = 10 * 1024 * 1024 * 1024;
  const LARGE_QUEUE_BYTES = 25 * 1024 * 1024 * 1024;
  const PROTO_VER = 1;
  const SESSION_ID = crypto.randomUUID();
  const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302'] }];

  const ADJ = ['Mast','Jhakaas','Bindass','Dhansu','Natkhat','Rangeela','Tez','Zabardast','Chulbula','Shaandar','Bindaas','Mastana','Filmy','Pataka','Jugadu','Hatke','Desi','Nawab','Tashan','Dhamaka'];
  const PLATFORM_NAME = { ios: 'iOS', android: 'Android', windows: 'Windows', mac: 'Mac', linux: 'Linux', other: 'Device' };

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
  let controlChannel = null;
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
  let pendingInput = null;
  let toastTimer = null;
  let saveDirectoryHandle = null;
  let saveDirectoryReady = false;
  let backupSessionDirectory = null;
  let backupSessionPath = '';
  let overwritePolicy = null;
  let pendingOverwrite = null;

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
  function connectionMode() {
    const type = navigator.connection?.type;
    if (type === 'wifi' || type === 'wimax') return 'Wi-Fi';
    if (type === 'ethernet') return 'Ethernet';
    if (type === 'cellular') return 'Cellular';
    if (type === 'none' || !navigator.onLine) return 'Offline';
    return 'Network';
  }
  function updateConnectionMode() {
    const element = document.getElementById('networkMode');
    const estimate = document.getElementById('networkEstimate');
    if (!element) return;
    const connection = navigator.connection;
    const mode = connectionMode();
    const effectiveType = connection?.effectiveType;
    const downlink = Number(connection?.downlink);
    element.textContent = mode;
    element.title = mode === 'Wi-Fi'
      ? 'Connected over Wi-Fi. Browsers do not expose whether it is 2.4, 5, or 6 GHz.'
      : 'Detected from browser network information when available.';
    if (estimate) {
      const details = [];
      if (effectiveType) details.push(effectiveType.toUpperCase());
      if (Number.isFinite(downlink) && downlink > 0) details.push(`~${downlink} Mbps down`);
      estimate.textContent = details.length ? `· ${details.join(' · ')}` : '· speed unavailable';
      estimate.title = details.length
        ? 'Browser-provided estimate. This is not the maximum transmit speed.'
        : 'This browser does not expose a connection speed estimate.';
    }
  }
  function iconFor(kind) {
    return { ios: 'smartphone', android: 'smartphone', windows: 'monitor', mac: 'laptop', linux: 'hard-drive' }[kind] || 'monitor';
  }
  function platformIconFor(kind) {
    const icons = {
      ios: '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 fill-current"><path d="M16.7 12.8c0-2.1 1.7-3.1 1.8-3.2-1-.1-2.1-1.1-3.4-1.1-1.4-.1-2.7.8-3.4.8-.7 0-1.7-.8-2.8-.8-1.4 0-2.7.8-3.4 2.1-1.5 2.6-.4 6.5 1 8.6.7 1 1.5 2 2.6 2 1 0 1.4-.7 2.7-.7 1.3 0 1.7.7 2.7.7 1.1 0 1.8-1 2.5-2 .8-1.1 1.1-2.3 1.1-2.4-.1 0-2.1-.8-2.1-3.9ZM14.5 7.1c.6-.8 1-1.8.9-2.8-.9 0-2 .6-2.6 1.4-.6.7-1 1.7-.9 2.7 1 .1 2-.5 2.6-1.3Z"/></svg>',
      mac: '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 fill-current"><path d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm0 1.8a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-2.1 3.4h4.2v1.8H9.9V7.4Zm0 3.2h4.2v1.8H9.9v-1.8Zm0 3.2h4.2v1.8H9.9v-1.8Z"/></svg>',
      windows: '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 fill-current"><path d="m3 4.8 8-1.1v7.1H3V4.8Zm9.3-1.3L21 2.3v8.5h-8.7V3.5ZM3 12.8h8v7.5l-8-1.1v-6.4Zm9.3 0H21v8.9l-8.7-1.2v-7.7Z"/></svg>',
      android: '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 fill-current"><path d="M7.1 8.8h9.8v8.1a1 1 0 0 1-1 1h-.9v2.4a.9.9 0 1 1-1.8 0v-2.4h-2.4v2.4a.9.9 0 1 1-1.8 0v-2.4h-.9a1 1 0 0 1-1-1V8.8Zm-1.7.8a.9.9 0 0 1 .9.9v4.3a.9.9 0 1 1-1.8 0v-4.3a.9.9 0 0 1 .9-.9Zm13.2 0a.9.9 0 0 1 .9.9v4.3a.9.9 0 1 1-1.8 0v-4.3a.9.9 0 0 1 .9-.9ZM8.6 7.8a3.8 3.8 0 0 1 1.1-2.7L8.8 4a.4.4 0 1 1 .6-.6l1 1.1a3.8 3.8 0 0 1 3.2 0l1-1.1a.4.4 0 1 1 .6.6l-.9 1.1a3.8 3.8 0 0 1 1.1 2.7H8.6Zm2.1-2a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Zm2.6 0a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z"/></svg>',
      linux: '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 fill-current"><path d="M12 2.5c-3.1 0-4.6 2.7-4.6 5.8 0 1.8-.8 2.8-1.8 4-.9 1-1.8 2.2-1.2 3.6.4 1 1.5 1.4 2.6 1.3-.2.9-.1 1.8.5 2.5.6.8 1.7.9 2.5.4.6 1 1.6 1.4 2.6 1.1.6-.2 1-.7 1.4-1.2.5.5 1 .9 1.7 1.1 1 .3 2-.2 2.4-1.2.9.1 1.8-.3 2.2-1.1.6-1.3-.2-2.4-1-3.4 1 .1 2.1-.2 2.4-1.2.5-1.4-1.1-2.6-1.5-3.6-1-1.1-1.5-2.1-1.5-3.7 0-2.9-1.7-4.4-3.8-4.4Zm-2 5.7a.7.7 0 1 1 1.4 0 .7.7 0 0 1-1.4 0Zm4.6 0a.7.7 0 1 1 1.4 0 .7.7 0 0 1-1.4 0ZM9 13.4c1.8 1 4.2 1 6 0-.3 1.5-1.4 2.3-3 2.3s-2.7-.8-3-2.3Z"/></svg>',
      other: '<svg viewBox="0 0 24 24" aria-hidden="true" class="h-4 w-4 fill-current"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 21h8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    };
    return icons[kind === 'mac' ? 'ios' : kind] || icons.other;
  }
  const esc = s => { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; };
  const randomName = () => `${ADJ[Math.floor(Math.random() * ADJ.length)]} ${PLATFORM_NAME[deviceKind]}`;
  const generatedBrandNames = /^(Amber|Azure|Crimson|Jade|Ivory|Onyx|Ruby|Slate|Cobalt|Ember|Frost|Nova|Pixel|Quartz|Sage|Storm|Vivid|Zephyr|Lunar|Bolt) (iPhone|iPad|MacBook|Pixel|Galaxy|OnePlus|Xiaomi|Surface|ThinkPad|Legion|iMac|Mac|TuxBox|Framework|XPS|Comet|Rover|Kite|Orbit)$/;
  const generatedIndianNames = new RegExp(`^(${ADJ.join('|')}) (iOS|Android|Windows|Mac|Linux|Device)$`);
  function showToast(title, description = '', type = 'info') {
    const region = document.getElementById('toastRegion');
    if (!region) return;
    const icon = type === 'success' ? 'circle-check' : type === 'error' ? 'circle-alert' : type === 'warning' ? 'triangle-alert' : 'info';
    const tone = type === 'success' ? 'text-success' : type === 'error' ? 'text-destructive' : type === 'warning' ? 'text-warning' : 'text-muted-foreground';
    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex animate-slide-up items-start gap-3 rounded-lg border border-border bg-popover/95 p-3 text-sm shadow-lg backdrop-blur';
    toast.innerHTML = `<i data-lucide="${icon}" class="mt-0.5 h-4 w-4 shrink-0 ${tone}"></i><div class="min-w-0"><p class="font-medium">${esc(title)}</p>${description ? `<p class="mt-0.5 text-xs text-muted-foreground">${esc(description)}</p>` : ''}</div><button aria-label="Dismiss notification" class="ml-auto shrink-0 text-muted-foreground hover:text-foreground">×</button>`;
    toast.querySelector('button').onclick = () => toast.remove();
    region.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => toast.remove(), 10000);
  }
  function currentTheme() {
    return localStorage.getItem('airlocal.theme') || 'device';
  }
  function applyTheme(theme) {
    const preference = ['device', 'light', 'dark'].includes(theme) ? theme : 'device';
    const dark = preference === 'dark' || (preference === 'device' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
    const select = document.getElementById('themeSelect');
    if (select) select.value = preference;
  }
  function setTheme(theme) {
    const preference = ['device', 'light', 'dark'].includes(theme) ? theme : 'device';
    localStorage.setItem('airlocal.theme', preference);
    applyTheme(preference);
    showToast('Theme updated', preference === 'device' ? 'Following your device setting.' : `${preference[0].toUpperCase()}${preference.slice(1)} theme enabled.`, 'success');
  }
  function organizeByType() {
    return localStorage.getItem('airlocal.organize-files') !== '0';
  }
  function backupMode() {
    return localStorage.getItem('airlocal.backup-mode') === '1';
  }
  function backupNamingConvention() {
    return localStorage.getItem('airlocal.backup-naming') || '{date}/{time}';
  }
  function setBackupNamingConvention(value) {
    const convention = value.trim() || '{date}/{time}';
    localStorage.setItem('airlocal.backup-naming', convention);
    backupSessionDirectory = null;
    backupSessionPath = '';
    overwritePolicy = null;
    updateSaveLocationUI();
  }
  function backupPathPreview() {
    const parts = expandBackupConvention(new Date());
    return parts.length ? parts.join('/') : 'Backup';
  }
  function setBackupMode(value) {
    localStorage.setItem('airlocal.backup-mode', value ? '1' : '0');
    backupSessionDirectory = null;
    backupSessionPath = '';
    overwritePolicy = null;
    updateSaveLocationUI();
  }
  function setOrganizeByType(value) {
    localStorage.setItem('airlocal.organize-files', value ? '1' : '0');
    updateSaveLocationUI();
  }
  function updateSaveLocationUI() {
    const name = document.getElementById('saveLocationName');
    const mainName = document.getElementById('mainSaveLocationName');
    const mainDescription = document.getElementById('mainSaveLocationDescription');
    const path = document.getElementById('saveLocationPath');
    const mainPath = document.getElementById('mainSaveLocationPath');
    const organize = document.getElementById('organizeFiles');
    const location = saveDirectoryReady ? saveDirectoryHandle.name : 'Browser Downloads';
    const detail = saveDirectoryReady
      ? backupMode() ? `Backup mode · ${organizeByType() ? 'organized by type' : 'kept together'}`
        : organizeByType() ? 'Files are organized into type folders.' : 'Files are saved directly here.'
      : 'Files will use your browser download folder.';
    if (name) name.textContent = saveDirectoryReady
      ? `${location}${organizeByType() ? ' · organized by type' : ''}`
      : `${location} (fallback)`;
    if (mainName) mainName.textContent = location;
    if (mainDescription) mainDescription.textContent = detail;
    const relativePath = saveDirectoryReady
      ? backupMode()
        ? backupSessionPath || `${location}/${backupPathPreview()}`
        : location
      : 'Browser Downloads';
    if (path) path.textContent = relativePath;
    if (mainPath) mainPath.textContent = relativePath;
    if (organize) organize.checked = organizeByType();
    const backup = document.getElementById('backupMode');
    if (backup) backup.checked = backupMode();
    const naming = document.getElementById('backupNaming');
    if (naming && document.activeElement !== naming) naming.value = backupNamingConvention();
    const namingPreview = document.getElementById('backupNamingPreview');
    if (namingPreview) namingPreview.textContent = saveDirectoryReady
      ? `${location}/${backupPathPreview()}`
      : backupPathPreview();
  }
  async function chooseSaveDirectory() {
    if (!window.showDirectoryPicker) {
      showToast('Custom folders unavailable', 'This browser will use your normal Downloads folder.', 'warning');
      return;
    }
    const confirmed = await requestConfirmation(
      'Choose a save folder',
      'AirLocal will ask your browser for permission to create folders and save received files in the folder you select.',
      'Choose folder'
    );
    if (!confirmed) return;
    try {
      const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
      if (!handle) return;
      if ((await handle.requestPermission({ mode: 'readwrite' })) !== 'granted') {
        showToast('Folder access declined', 'Received files will use browser downloads.', 'warning');
        return;
      }
      saveDirectoryHandle = handle;
      saveDirectoryReady = true;
      await saveDirectoryHandleToDb(handle);
      updateSaveLocationUI();
      showToast('Save folder updated', `Received files will be saved in ${handle.name}.`, 'success');
    } catch (error) {
      if (error.name !== 'AbortError') {
        saveDirectoryHandle = null;
        saveDirectoryReady = false;
        updateSaveLocationUI();
        showToast('Could not use that folder', 'Browser downloads will be used instead.', 'warning');
      }
    }
  }
  async function clearSaveDirectory() {
    saveDirectoryHandle = null;
    saveDirectoryReady = false;
    backupSessionDirectory = null;
    backupSessionPath = '';
    overwritePolicy = null;
    await saveDirectoryHandleToDb(null);
    updateSaveLocationUI();
    showToast('Save folder cleared', 'Received files will use browser downloads.', 'success');
  }
  function manageSaveLocation() {
    if (saveDirectoryReady) toggleSettings();
    else chooseSaveDirectory();
  }
  function openSelectedFolder() {
    if (!saveDirectoryReady) return chooseSaveDirectory();
    showToast('Use the folder picker to access this folder', 'Browsers cannot open Finder or File Explorer directly. Choose the same folder to access it.', 'info');
    chooseSaveDirectory();
  }
  function showOverwriteDialog(name, location) {
    const dialog = document.getElementById('overwriteDialog');
    if (!dialog) return Promise.resolve('skip');
    document.getElementById('overwriteFileName').textContent = name;
    document.getElementById('overwriteLocation').textContent = location;
    dialog.showModal();
    return new Promise(resolve => { pendingOverwrite = { resolve, dialog }; });
  }
  function resolveOverwrite(action) {
    if (!pendingOverwrite) return;
    const { resolve, dialog } = pendingOverwrite;
    pendingOverwrite = null;
    if (dialog.open) dialog.close();
    resolve(action);
  }
  function saveDirectoryDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('airlocal-settings', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('settings');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async function saveDirectoryHandleToDb(handle) {
    try {
      const db = await saveDirectoryDb();
      await new Promise((resolve, reject) => {
        const request = db.transaction('settings', 'readwrite').objectStore('settings').put(handle, 'save-directory');
        request.onsuccess = resolve;
        request.onerror = () => reject(request.error);
      });
      db.close();
    } catch (error) {
      dbg('Save folder persistence failed: ' + error.message);
    }
  }
  async function restoreSaveDirectory() {
    try {
      const db = await saveDirectoryDb();
      const handle = await new Promise((resolve, reject) => {
        const request = db.transaction('settings', 'readonly').objectStore('settings').get('save-directory');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
      db.close();
      if (handle && (await handle.queryPermission({ mode: 'readwrite' })) === 'granted') {
        saveDirectoryHandle = handle;
        saveDirectoryReady = true;
        backupSessionDirectory = null;
        backupSessionPath = '';
        overwritePolicy = null;
      }
    } catch (error) {
      dbg('Save folder restore failed: ' + error.message);
    }
    updateSaveLocationUI();
  }
  function saveCategory(name) {
    const extension = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg','jpeg','png','gif','webp','svg','heic','avif','bmp'].includes(extension)) return 'Images';
    if (['mp4','mov','mkv','webm','avi','m4v','3gp'].includes(extension)) return 'Videos';
    if (['mp3','wav','m4a','ogg','flac','aac'].includes(extension)) return 'Audio';
    if (['ppt','pptx','key','odp'].includes(extension)) return 'Presentations';
    if (['pdf','doc','docx','txt','rtf','xls','xlsx','csv','ods'].includes(extension)) return 'Documents';
    if (['zip','rar','7z','tar','gz','bz2'].includes(extension)) return 'Archives';
    return 'Other';
  }
  function safeFileName(name) {
    return name.split(/[\\/]/).pop().replace(/[<>:"|?*\u0000-\u001f]/g, '_').trim() || 'received-file';
  }
  function timestampPart(value) {
    return String(value).padStart(2, '0');
  }
  function expandBackupConvention(now) {
    const values = {
      date: `${now.getFullYear()}-${timestampPart(now.getMonth() + 1)}-${timestampPart(now.getDate())}`,
      time: `${timestampPart(now.getHours())}-${timestampPart(now.getMinutes())}-${timestampPart(now.getSeconds())}`,
      year: String(now.getFullYear()),
      month: timestampPart(now.getMonth() + 1),
      day: timestampPart(now.getDate()),
      hour: timestampPart(now.getHours()),
      minute: timestampPart(now.getMinutes()),
      second: timestampPart(now.getSeconds())
    };
    return backupNamingConvention()
      .replace(/\{(date|time|year|month|day|hour|minute|second)\}/g, (_, token) => values[token])
      .split(/[\\/]+/)
      .map(part => part.replace(/[<>:"|?*\u0000-\u001f]/g, '_').trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  async function getBackupDirectory() {
    if (!backupMode()) return { directory: saveDirectoryHandle, path: saveDirectoryHandle.name };
    if (backupSessionDirectory) return { directory: backupSessionDirectory, path: backupSessionPath };
    const now = new Date();
    const parts = expandBackupConvention(now);
    let directory = saveDirectoryHandle;
    const pathParts = [saveDirectoryHandle.name];
    for (const part of parts) {
      directory = await directory.getDirectoryHandle(part, { create: true });
      pathParts.push(part);
    }
    backupSessionDirectory = directory;
    backupSessionPath = pathParts.join('/');
    updateSaveLocationUI();
    return { directory: backupSessionDirectory, path: backupSessionPath };
  }
  async function uniqueFileName(directory, name) {
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : '';
    let candidate = name;
    let index = 1;
    while (true) {
      try {
        await directory.getFileHandle(candidate);
        candidate = `${base} (${index++})${extension}`;
      } catch (error) {
        if (error.name === 'NotFoundError') return candidate;
        throw error;
      }
    }
  }
  async function saveToSelectedDirectory(file, name) {
    if (!saveDirectoryHandle || !saveDirectoryReady) return null;
    try {
      if ((await saveDirectoryHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') throw new Error('Folder permission expired');
      const backup = await getBackupDirectory();
      const category = organizeByType() ? saveCategory(name) : null;
      const directory = category
        ? await backup.directory.getDirectoryHandle(category, { create: true })
        : backup.directory;
      const originalName = safeFileName(name);
      let targetName = originalName;
      let exists = true;
      try { await directory.getFileHandle(originalName); } catch (error) {
        if (error.name === 'NotFoundError') exists = false;
        else throw error;
      }
      if (exists) {
        const location = `${backup.path}${category ? `/${category}` : ''}`;
        const action = overwritePolicy || await showOverwriteDialog(originalName, location);
        if (action === 'replace-all') {
          overwritePolicy = 'replace';
        } else if (action === 'replace') {
          targetName = originalName;
        } else if (action === 'keep') {
          targetName = await uniqueFileName(directory, originalName);
        } else {
          return { skipped: true, name: originalName, folder: location };
        }
      }
      const target = await directory.getFileHandle(targetName, { create: true });
      const writable = await target.createWritable();
      await writable.write(file);
      await writable.close();
      return { folder: `${backup.path}${category ? `/${category}` : ''}`, name: targetName };
    } catch (error) {
      saveDirectoryReady = false;
      saveDirectoryHandle = null;
      await saveDirectoryHandleToDb(null);
      dbg('Custom save failed: ' + error.message);
      return null;
    }
  }
  function dismissOnboarding() {
    localStorage.setItem('airlocal.onboarding.dismissed', '1');
    document.getElementById('onboardingCard')?.remove();
  }
  function renderInfoPage() {
    const infoMain = document.getElementById('infoMain');
    const appMain = document.getElementById('appMain');
    if (!infoMain || !appMain) return;
    const page = location.hash.slice(1);
    const isInfoPage = page === 'how-it-works' || page === 'citations';
    appMain.classList.toggle('hidden', isInfoPage);
    infoMain.classList.toggle('hidden', !isInfoPage);
    if (isInfoPage) {
      requestAnimationFrame(() => document.getElementById(page)?.scrollIntoView({ block: 'start' }));
      lucide.createIcons();
    }
  }
  function toggleSettings() {
    const dialog = document.getElementById('settingsDialog');
    if (dialog?.open) dialog.close();
    else {
      document.getElementById('themeSelect').value = currentTheme();
      dialog?.showModal();
    }
  }
  function closeSettings() { document.getElementById('settingsDialog')?.close(); }
  function clearTransferHistory() {
    sendTransfers.forEach((transfer, id) => { if (['complete', 'stopped', 'error'].includes(transfer.status)) sendTransfers.delete(id); });
    receiveTransfers.forEach((transfer, id) => { if (['complete', 'stopped', 'error'].includes(transfer.status)) receiveTransfers.delete(id); });
    renderTransfers();
    showToast('Transfer history cleared', 'Active transfers were kept.', 'success');
  }
  function retryConnection() {
    const peer = activePeer || pendingPeer;
    if (peer) requestConnection(peer, false);
    else relayConnect();
    document.getElementById('reconnectBanner')?.classList.add('hidden');
  }
  function requestInput(title, description, value) {
    const dialog = document.getElementById('inputDialog');
    document.getElementById('inputTitle').textContent = title;
    document.getElementById('inputDescription').textContent = description;
    const input = document.getElementById('inputValue');
    input.value = value;
    return new Promise(resolve => {
      pendingInput = { resolve, dialog };
      dialog.showModal();
      input.focus();
      input.select();
    });
  }
  function resolveInput(value) {
    if (!pendingInput) return;
    const { resolve, dialog } = pendingInput;
    pendingInput = null;
    if (dialog.open) dialog.close();
    resolve(value);
  }

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
    clearPeerRoster();
    const networkLabel = document.getElementById('networkLabel');
    if (networkLabel) networkLabel.textContent = room;
    document.getElementById('selfRoomHint').textContent = room;
    renderQr();
    try { if (ws) ws.close(); } catch {} // reconnect into the new room
  }
  function clearPeerRoster() {
    peers.clear();
    document.querySelectorAll('#peerGrid > [id^="peer-"]').forEach(el => el.remove());
    refreshPeerUI();
  }
  async function editRoom() {
    const input = await requestInput('Change room code', 'Use the same four-digit code on every device.', getRoom());
    if (input === null) return;
    const room = sanitizeRoom(input);
    if (room.length !== 4) {
      showToast('Invalid room code', 'Enter exactly four digits.', 'error');
      return;
    }
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
    const tone = type === 'error' ? 'text-destructive' : type === 'success' ? 'text-foreground' : 'text-muted-foreground';
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
      busy: 'bg-warning',
      off: 'bg-zinc-500',
    };
    dot.className = `relative inline-flex h-2 w-2 rounded-full ${tones[mode] || tones.off}`;
    ping.className = `absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${tones[mode] || tones.off}`;
    ping.style.display = mode === 'online' ? 'none' : '';
    const ds = document.getElementById('discoveryState');
    ds.innerText = mode === 'online' ? 'online' : mode === 'busy' ? 'pairing' : 'connecting';
    ds.className = `mt-0.5 text-xs font-medium ${mode === 'online' ? 'text-success' : 'text-warning'}`;
    const badge = document.getElementById('connectionBadge');
    if (badge) badge.setAttribute('aria-label', `Connection status: ${label}`);
    document.body.setAttribute('aria-busy', mode === 'off' || mode === 'busy' ? 'true' : 'false');
    updateConnectionMode();
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
    if (!transfer || transfer.status !== 'active') return;
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
    const tone = transfer.status === 'complete' ? 'bg-success' : transfer.status === 'error' ? 'bg-destructive' : 'bg-primary';
    const label = transfer.status === 'complete' ? 'Complete' : transfer.status === 'error' ? 'Failed' : transfer.status === 'stopped' ? 'Stopped' : transfer.status === 'queued' ? 'Queued' : `${pct}%`;
    const canCancel = transfer.status === 'active' || transfer.status === 'queued';
    return `<div class="rounded-md border border-border bg-background/50 p-3" data-transfer-id="${transfer.id}" data-direction="${transfer.direction}">
      <div class="mb-2 flex items-center justify-between gap-3">
        <span class="min-w-0 truncate text-xs font-medium">${esc(transfer.name)}</span>
        <span class="flex shrink-0 items-center gap-2">
          <span class="transfer-label text-[10px] font-medium tabular-nums text-muted-foreground">${label}</span>
          ${canCancel ? `<button type="button" onclick="cancelTransfer('${transfer.direction}', '${transfer.id}')" class="rounded px-1 text-[10px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive">${transfer.status === 'active' ? 'Cancel' : 'Remove'}</button>` : ''}
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
  function showQueueDuplicateAlert(paths) {
    const dialog = document.getElementById('queueNoticeDialog');
    if (!dialog) return;
    const count = paths.length;
    document.getElementById('queueNoticeTitle').textContent =
      count === 1 ? 'Already added to queue' : 'Files already added to queue';
    document.getElementById('queueNoticeDescription').textContent =
      paths.join('\n');
    if (dialog.open) dialog.close();
    dialog.showModal();
    document.querySelector('#queueNoticeDialog button')?.focus();
  }
  function checkBrowserSupport() {
    const missing = [];
    if (!window.isSecureContext) missing.push('HTTPS');
    if (!window.RTCPeerConnection) missing.push('WebRTC');
    if (!window.WebSocket) missing.push('WebSocket');
    if (!navigator.storage?.getDirectory) missing.push('OPFS file storage');
    if (missing.length) {
      const banner = document.getElementById('compatibilityBanner');
      const detail = document.getElementById('compatibilityDetails');
      if (banner && detail) {
        detail.textContent = `This browser is missing: ${missing.join(', ')}. Use the latest Chrome, Safari, Edge, or Firefox over HTTPS.`;
        banner.classList.remove('hidden');
      }
      return false;
    }
    return true;
  }
  function closeQueueNotice() {
    const dialog = document.getElementById('queueNoticeDialog');
    if (dialog?.open) dialog.close();
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
      ? `${fmtSpeed(transfer.speed)} · About ${formatETA((transfer.size - transfer.progress) / transfer.speed)} left`
      : transfer.status === 'complete' ? 'Saved successfully' : transfer.status === 'stopped' ? 'Transfer canceled' : transfer.status;
    if (label) label.textContent = transfer.status === 'active' ? `${pct}%` : transfer.status === 'stopped' ? 'Canceled' : transfer.status;
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
    const control = controlChannel?.readyState === 'open' ? controlChannel : null;
    if (control) {
      try { control.send(message); } catch {}
      return;
    }
    channels.filter(ch => ch.readyState === 'open').forEach(ch => {
      try { ch.send(message); } catch {}
    });
  }
  async function stopRemoteSendTransfer(id) {
    const transfer = sendTransfers.get(String(id));
    if (!transfer || !['active', 'queued'].includes(transfer.status)) return;
    transfer.cancelled = true;
    transfer.cancelledRemotely = true;
    transfer.status = 'stopped';
    transfer.permissionResolved = true;
    transfer.resolvePermission?.(false);
    try { await transfer.reader?.cancel(); } catch {}
    renderTransfers();
    log(`Stopped by receiver: ${transfer.name}`, 'error');
    showToast('Transfer canceled', `${transfer.name} was canceled by the receiving device.`, 'warning');
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
    if (direction === 'receive') {
      sendTransferControl('CANCEL', id);
      if (activePeer) signal(activePeer, { t: 'transfer-cancel', transferId: id });
      discardReceiveTransfer(transfer);
    }
    renderTransfers();
    showToast('Transfer canceled', `${transfer.name} was canceled.`, 'warning');
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
      clearPeerRoster();
      setStatus('Online', 'online');
      dbg('WS OPEN');
      startHeartbeat();
      ws.send(JSON.stringify({ v: PROTO_VER, type: 'join', sid: SESSION_ID, name: deviceName, kind: deviceKind }));
    };

    ws.onmessage = e => {
      let msg; try { msg = JSON.parse(e.data); } catch { return; }
      if (!msg || msg.v !== PROTO_VER) return;
      if (msg.type === 'peers') syncPeers(msg.peers || []);
      else if (msg.type === 'error' && msg.code === 'room-full') showToast('Room is full', 'Use another room code to connect more devices.', 'error');
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
  window.addEventListener('online', updateConnectionMode);
  window.addEventListener('offline', updateConnectionMode);
  navigator.connection?.addEventListener('change', updateConnectionMode);
  window.addEventListener('focus', relayConnect);

  function relaySend(obj) {
    if (wsOpen && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  function signal(toSid, payload) {
    relaySend({ v: PROTO_VER, type: 'signal', sid: SESSION_ID, to: toSid, payload });
  }

  // ---------- Peer roster ----------
  function syncPeers(roster) {
    // The relay broadcasts the full room roster, including this session.
    // Keep the nearby list strictly limited to other sessions.
    peers.delete(SESSION_ID);
    document.getElementById(`peer-${SESSION_ID}`)?.remove();
    const now = Date.now();
    const seen = new Set();
    for (const p of roster) {
      if (!p || p.sid === SESSION_ID) continue;
      if (p.lastSeen && now - p.lastSeen > 65000) continue;
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
    const title = document.getElementById('emptyStateTitle');
    const description = document.getElementById('emptyStateDescription');
    if (title && !roster.filter(p => p.sid !== SESSION_ID).length) {
      title.textContent = wsOpen ? 'No other devices found' : 'Looking for devices…';
      description.textContent = wsOpen ? 'Scan the QR code to connect, or open AirLocal and enter the same room code.' : 'Connecting to the discovery service…';
    }
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
    if (!peer || peer.sid === SESSION_ID) return;
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
    const platform = { ios: 'iOS', android: 'Android', windows: 'Windows', mac: 'macOS', linux: 'Linux' }[peer.kind] || 'Device';
    return `
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <i data-lucide="${iconFor(peer.kind)}" class="h-5 w-5"></i>
      </div>
      <span class="peer-name w-full truncate text-xs font-medium">${esc(peer.name)}</span>
      <span class="platform-badge-icon inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border/70 bg-secondary/40 px-2 py-1 text-[10px] font-medium leading-none text-muted-foreground" title="${esc(platform)}">
        <span class="flex h-4 w-4 shrink-0 items-center justify-center">${platformIconFor(peer.kind)}</span>
        <span>${platform}</span>
      </span>
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
    controlChannel = null;
    if (initiator) {
      controlChannel = pc.createDataChannel('control', { ordered: true });
      controlChannel.binaryType = 'arraybuffer';
      wireChannel(controlChannel);
      for (let i = 0; i < NUM_CHANNELS; i++) {
        const ch = pc.createDataChannel(`ch-${i}`, { ordered: false });
        ch.binaryType = 'arraybuffer';
        wireChannel(ch);
        channels.push(ch);
      }
    } else {
      pc.ondatachannel = e => {
        const ch = e.channel;
        ch.binaryType = 'arraybuffer';
        if (ch.label === 'control') {
          controlChannel = ch;
          wireChannel(ch);
        } else {
          wireChannel(ch);
          channels.push(ch);
        }
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

  function wireChannel(ch) {
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
        showToast('Connected securely', `Ready to send files to ${p ? p.name : 'your device'}.`, 'success');
        renderStagedQueue();
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
        showToast('Connection lost', 'Your remaining queued files are still here.', 'warning');
        document.getElementById('reconnectBanner')?.classList.remove('hidden');
        return;
      }
      case 'transfer-cancel': {
        await stopRemoteSendTransfer(msg.transferId);
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
    pc = null; channels = []; controlChannel = null; activePeer = null;
    backupSessionDirectory = null;
    backupSessionPath = '';
    overwritePolicy = null;
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
      if (reason === 'Link dropped') {
        document.getElementById('reconnectBanner')?.classList.remove('hidden');
        showToast('Connection interrupted', 'Reconnect to continue sending.', 'warning');
      }
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
        const id = String(msg.transferId);
        const transfer = receiveTransfers.get(id);
        const sendingTransfer = sendTransfers.get(id);
        if (sendingTransfer) {
          await stopRemoteSendTransfer(id);
          return;
        }
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
    const savedToFolder = await saveToSelectedDirectory(file, transfer.name);
    if (!savedToFolder || savedToFolder.skipped) {
      if (savedToFolder?.skipped) {
        transfer.status = 'stopped';
        renderTransfers();
        showToast('File skipped', `${savedToFolder.name} was not saved because it already exists.`, 'warning');
        try { (await navigator.storage.getDirectory()).removeEntry(transfer.name); } catch {}
        return;
      }
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url; a.download = safeFileName(transfer.name);
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
    const name = transfer.name;
    setTimeout(async () => {
      try { (await navigator.storage.getDirectory()).removeEntry(name); } catch {}
    }, 30000);
    transfer.progress = transfer.size;
    transfer.status = 'complete';
    finalizeTransferTelemetry(transfer);
    renderTransfers();
    log(`Saved: ${transfer.name}`, 'success');
    showToast(
      savedToFolder ? 'File saved successfully' : 'Transfer complete',
      savedToFolder
        ? `${savedToFolder.name} was stored at ${savedToFolder.folder}/${savedToFolder.name}.`
        : `${transfer.name} was downloaded by your browser.`,
      'success'
    );
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
      transfer.reader = reader;

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
        if (!transfer.cancelledRemotely) {
          const cancelMessage = JSON.stringify({ type: 'CANCEL', transferId: id });
          open.forEach(ch => { try { ch.send(cancelMessage); } catch {} });
        }
        transfer.status = 'stopped';
        transfer.reader = null;
        renderTransfers();
        showToast('Transfer canceled', `${file.name} was canceled. Moving to the next file.`, 'warning');
        continue;
      }
      transfer.reader = null;
      const endMessage = JSON.stringify({ type: 'END', transferId: id });
      open.forEach(ch => { try { ch.send(endMessage); } catch {} });
      updateTransfer(sendTransfers, id, { progress: file.size, status: 'complete' });
      finalizeTransferTelemetry(transfer);
      renderTransfers();
      log(`Sent: ${file.name}`, 'success');
      showToast('Transfer complete', `${file.name} was sent successfully.`, 'success');
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
          <span class="min-w-0 truncate font-medium" title="${esc(filePath(f))}">${esc(f.name)}<span class="ml-1 font-normal text-muted-foreground">${esc(filePath(f) === f.name ? '' : `· ${filePath(f)}`)}</span></span>
        </span>
        <span class="ml-2 flex shrink-0 items-center gap-2 text-muted-foreground">
          <span class="tabular-nums">${fmtMB(f.size)}</span>
          <button type="button" onclick="removeStagedFile(${index})" class="rounded px-1 text-[10px] hover:bg-destructive/10 hover:text-destructive" title="Remove from queue">Remove</button>
        </span>
      </div>`).join('');
    lucide.createIcons();
    document.getElementById('stagedContainer').classList.toggle('hidden', stagedFiles.length === 0);
    const total = stagedFiles.reduce((sum, file) => sum + file.size, 0);
    const summary = document.getElementById('queueSummary');
    if (summary) summary.textContent = `${stagedFiles.length} ${stagedFiles.length === 1 ? 'file' : 'files'} · ${fmtMB(total)}`;
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) sendBtn.disabled = !activePeer || !stagedFiles.length || transmitRunning;
    const clearBtn = document.getElementById('clearQueueBtn');
    if (clearBtn) clearBtn.disabled = !stagedFiles.length;
  }
  function clearStagedQueue() {
    if (!stagedFiles.length) return;
    stagedFiles = [];
    renderStagedQueue();
    showToast('Send queue cleared');
  }
  function removeStagedFile(index) {
    if (index < 0 || index >= stagedFiles.length) return;
    stagedFiles.splice(index, 1);
    renderStagedQueue();
  }

  // ---------- UI wiring ----------
  async function renameSelf() {
    const name = await requestInput('Rename this device', 'This name will be shown to nearby devices.', deviceName);
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

  async function stageFiles(files) {
    if (!files.length) return;
    const queuedPaths = new Set(stagedFiles.map(filePath));
    let queuedBytes = stagedFiles.reduce((sum, file) => sum + file.size, 0);
    const additions = [];
    const duplicates = [];
    for (const file of files) {
      const path = filePath(file);
      if (queuedPaths.has(path)) {
        duplicates.push(path);
        continue;
      }
      queuedPaths.add(path);
      additions.push(file);
      queuedBytes += file.size;
    }
    if (!additions.length) {
      if (duplicates.length) {
        const uniqueDuplicates = [...new Set(duplicates)];
        uniqueDuplicates.forEach(path => log(`Already added to send queue: ${path}`, 'error'));
        showQueueDuplicateAlert(uniqueDuplicates);
        showToast('Already added to queue', `${uniqueDuplicates.length} duplicate ${uniqueDuplicates.length === 1 ? 'file was' : 'files were'} skipped.`, 'warning');
      }
      return;
    }
    const totalFiles = stagedFiles.length + additions.length;
    const totalBytes = queuedBytes;
    const largeFiles = additions.filter(file => file.size > LARGE_FILE_BYTES).length;
    if (totalFiles > LARGE_QUEUE_FILES || totalBytes > LARGE_QUEUE_BYTES || largeFiles) {
      const reasons = [];
      if (totalFiles > LARGE_QUEUE_FILES) reasons.push(`${totalFiles} files`);
      if (totalBytes > LARGE_QUEUE_BYTES) reasons.push(`${fmtMB(totalBytes)} total`);
      if (largeFiles) reasons.push(`${largeFiles} file${largeFiles === 1 ? '' : 's'} over 10 GB`);
      const confirmed = await requestConfirmation(
        'This is a large queue',
        `${reasons.join(' · ')}.\n\nLarge transfers may take longer and need enough free storage on the receiving device. Continue adding these files?`,
        'Continue'
      );
      if (!confirmed) return;
    }
    stagedFiles = [...stagedFiles, ...additions];
    renderStagedQueue();
    if (duplicates.length) {
      const uniqueDuplicates = [...new Set(duplicates)];
      uniqueDuplicates.forEach(path => log(`Already added to send queue: ${path}`, 'error'));
      showQueueDuplicateAlert(uniqueDuplicates);
      showToast('Already added to queue', `${uniqueDuplicates.length} duplicate ${uniqueDuplicates.length === 1 ? 'file was' : 'files were'} skipped.`, 'warning');
    }
  }

  // ---------- Boot ----------
  window.addEventListener('DOMContentLoaded', async () => {
    updateConnectionMode();
    renderInfoPage();
    window.addEventListener('hashchange', renderInfoPage);
    applyTheme(currentTheme());
    checkBrowserSupport();
    await restoreSaveDirectory();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentTheme() === 'device') applyTheme('device');
    });
    await clearStaleOpfsFiles();
    lucide.createIcons();
    document.getElementById('confirmDialog').addEventListener('close', () => {
      if (!pendingConfirmation) return;
      const { resolve } = pendingConfirmation;
      pendingConfirmation = null;
      resolve(false);
    });
    document.getElementById('overwriteDialog').addEventListener('close', () => {
      if (pendingOverwrite) resolveOverwrite('skip');
    });
    document.getElementById('inputDialog').addEventListener('close', () => {
      if (!pendingInput) return;
      const { resolve } = pendingInput;
      pendingInput = null;
      resolve(null);
    });
    document.getElementById('inputValue').addEventListener('keydown', event => {
      if (event.key === 'Enter') resolveInput(event.currentTarget.value);
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
    if (!deviceName || generatedBrandNames.test(deviceName) || generatedIndianNames.test(deviceName)) {
      deviceName = randomName();
      localStorage.setItem('airlocal.name', deviceName);
    }
    document.getElementById('selfName').textContent = deviceName;
    document.getElementById('selfAvatar').innerHTML = `<i data-lucide="${iconFor(deviceKind)}" class="h-4 w-4"></i>`;
    lucide.createIcons();
    setupDropZone();
    if (localStorage.getItem('airlocal.onboarding.dismissed') === '1') {
      document.getElementById('onboardingCard')?.remove();
    }
    renderStagedQueue();
    if (document.getElementById('settingsDialog')) lucide.createIcons();

    qrTargetSid = sanitizeSid(new URLSearchParams(location.search).get('device'));
    qrPairToken = new URLSearchParams(location.search).get('pair');
    if (qrTargetSid === SESSION_ID) qrTargetSid = null;
    if (qrTargetSid) document.getElementById('onboardingCard')?.remove();
    networkId = getRoom();
    const networkLabel = document.getElementById('networkLabel');
    if (networkLabel) networkLabel.textContent = networkId;
    document.getElementById('selfRoomHint').textContent = networkId;
    renderQr();
    dbg('room = ' + networkId);
    relayConnect();
  });

  window.addEventListener('pagehide', () => {
    if (activePeer) signal(activePeer, { t: 'hangup' });
    relaySend({ v: PROTO_VER, type: 'leave', sid: SESSION_ID });
  });
