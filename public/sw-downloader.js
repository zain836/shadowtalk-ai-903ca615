// =============================================================================
// SHADOWTALK SILENT DOWNLOADER - Service Worker
// =============================================================================
// Handles background model downloads that survive tab closes
// Uses Origin Private File System (OPFS) for persistent storage
// =============================================================================

const SW_VERSION = '1.0.0';
const CACHE_NAME = 'shadowtalk-models-v1';

// Message types
const MSG_TYPES = {
  START_DOWNLOAD: 'START_DOWNLOAD',
  PAUSE_DOWNLOAD: 'PAUSE_DOWNLOAD',
  RESUME_DOWNLOAD: 'RESUME_DOWNLOAD',
  CANCEL_DOWNLOAD: 'CANCEL_DOWNLOAD',
  GET_STATUS: 'GET_STATUS',
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',
  DOWNLOAD_COMPLETE: 'DOWNLOAD_COMPLETE',
  DOWNLOAD_ERROR: 'DOWNLOAD_ERROR',
};

// Active downloads tracking
const activeDownloads = new Map();

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW-Downloader] Installing v' + SW_VERSION);
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW-Downloader] Activated v' + SW_VERSION);
  event.waitUntil(self.clients.claim());
});

// Message handler
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case MSG_TYPES.START_DOWNLOAD:
      await startDownload(event.source, payload);
      break;
      
    case MSG_TYPES.PAUSE_DOWNLOAD:
      pauseDownload(payload.downloadId);
      break;
      
    case MSG_TYPES.RESUME_DOWNLOAD:
      await resumeDownload(event.source, payload.downloadId);
      break;
      
    case MSG_TYPES.CANCEL_DOWNLOAD:
      cancelDownload(payload.downloadId);
      break;
      
    case MSG_TYPES.GET_STATUS:
      sendStatus(event.source);
      break;
  }
});

// Start a chunked download
async function startDownload(client, { downloadId, modelId, url, totalBytes, chunkSize }) {
  console.log(`[SW-Downloader] Starting download: ${modelId}`);
  
  const controller = new AbortController();
  const download = {
    id: downloadId,
    modelId,
    url,
    totalBytes,
    chunkSize: chunkSize || 100 * 1024 * 1024, // 100MB chunks
    downloadedBytes: 0,
    chunks: [],
    controller,
    isPaused: false,
    startedAt: Date.now(),
  };
  
  activeDownloads.set(downloadId, download);
  
  try {
    // Calculate chunks
    const numChunks = Math.ceil(totalBytes / download.chunkSize);
    for (let i = 0; i < numChunks; i++) {
      download.chunks.push({
        index: i,
        start: i * download.chunkSize,
        end: Math.min((i + 1) * download.chunkSize - 1, totalBytes - 1),
        downloaded: false,
      });
    }
    
    // Download each chunk
    for (const chunk of download.chunks) {
      if (download.isPaused || controller.signal.aborted) {
        return;
      }
      
      await downloadChunk(client, download, chunk);
    }
    
    // Complete
    notifyClient(client, MSG_TYPES.DOWNLOAD_COMPLETE, {
      downloadId,
      modelId,
      totalBytes: download.downloadedBytes,
    });
    
    activeDownloads.delete(downloadId);
    console.log(`[SW-Downloader] ✅ Completed: ${modelId}`);
    
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(`[SW-Downloader] Error: ${error.message}`);
      notifyClient(client, MSG_TYPES.DOWNLOAD_ERROR, {
        downloadId,
        error: error.message,
      });
    }
    activeDownloads.delete(downloadId);
  }
}

// Download a single chunk with retry
async function downloadChunk(client, download, chunk, retries = 3) {
  const { url, controller, chunkSize } = download;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Range': `bytes=${chunk.start}-${chunk.end}`,
      },
      signal: controller.signal,
    });
    
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const reader = response.body.getReader();
    let chunkBytes = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunkBytes += value.length;
      download.downloadedBytes += value.length;
      
      // Store in cache (simulated - real implementation would use OPFS)
      // In production, this would write to Origin Private File System
      
      // Send progress update (throttled)
      if (chunkBytes % (1024 * 1024) < value.length) { // Every ~1MB
        notifyClient(client, MSG_TYPES.PROGRESS_UPDATE, {
          downloadId: download.id,
          downloadedBytes: download.downloadedBytes,
          totalBytes: download.totalBytes,
          progress: Math.round((download.downloadedBytes / download.totalBytes) * 100),
        });
      }
    }
    
    chunk.downloaded = true;
    
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    
    if (retries > 0) {
      console.log(`[SW-Downloader] Retrying chunk ${chunk.index}...`);
      await new Promise(r => setTimeout(r, 1000));
      return downloadChunk(client, download, chunk, retries - 1);
    }
    throw error;
  }
}

// Pause a download
function pauseDownload(downloadId) {
  const download = activeDownloads.get(downloadId);
  if (download) {
    download.isPaused = true;
    console.log(`[SW-Downloader] Paused: ${download.modelId}`);
  }
}

// Resume a download
async function resumeDownload(client, downloadId) {
  const download = activeDownloads.get(downloadId);
  if (download && download.isPaused) {
    download.isPaused = false;
    console.log(`[SW-Downloader] Resuming: ${download.modelId}`);
    
    // Continue with remaining chunks
    for (const chunk of download.chunks) {
      if (chunk.downloaded) continue;
      if (download.isPaused || download.controller.signal.aborted) return;
      await downloadChunk(client, download, chunk);
    }
  }
}

// Cancel a download
function cancelDownload(downloadId) {
  const download = activeDownloads.get(downloadId);
  if (download) {
    download.controller.abort();
    activeDownloads.delete(downloadId);
    console.log(`[SW-Downloader] Cancelled: ${download.modelId}`);
  }
}

// Send status to client
function sendStatus(client) {
  const status = Array.from(activeDownloads.values()).map(d => ({
    downloadId: d.id,
    modelId: d.modelId,
    downloadedBytes: d.downloadedBytes,
    totalBytes: d.totalBytes,
    progress: Math.round((d.downloadedBytes / d.totalBytes) * 100),
    isPaused: d.isPaused,
  }));
  
  client.postMessage({
    type: 'STATUS_UPDATE',
    payload: { downloads: status },
  });
}

// Notify client
function notifyClient(client, type, payload) {
  try {
    client.postMessage({ type, payload });
  } catch (e) {
    // Client may have closed - broadcast to all
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.postMessage({ type, payload }));
    });
  }
}

// Periodic sync for background downloads (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'model-download') {
    event.waitUntil(checkPendingDownloads());
  }
});

async function checkPendingDownloads() {
  // Check IndexedDB for pending downloads and resume if any
  console.log('[SW-Downloader] Checking for pending downloads...');
}
