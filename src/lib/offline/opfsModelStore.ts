/**
 * OPFS Model Store
 * --------------------------------------------------
 * Streaming download + persistent storage of large model artefacts in the
 * Origin Private File System. Falls back gracefully when OPFS is unavailable.
 *
 * Designed for the Hybrid (Option B) Gemma 4B deployment described in the
 * Shadowoffline blueprint. Files are kept under /models/<modelId>/<filename>.
 */

export type DownloadProgress = {
  modelId: string;
  file: string;
  loaded: number;
  total: number;
  percent: number;
};

export type ModelStatus = {
  modelId: string;
  bytes: number;
  files: string[];
};

const ROOT_DIR = "models";

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle | null> {
  try {
    if (!("storage" in navigator) || !navigator.storage.getDirectory) return null;
    return await navigator.storage.getDirectory();
  } catch {
    return null;
  }
}

export async function isOpfsAvailable(): Promise<boolean> {
  return (await getOpfsRoot()) !== null;
}

/** Request persistent storage so the browser does not evict the model. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      const granted = await navigator.storage.persist();
      return granted;
    }
  } catch {
    /* ignore */
  }
  return false;
}

async function getModelDir(
  modelId: string,
  create = false,
): Promise<FileSystemDirectoryHandle | null> {
  const root = await getOpfsRoot();
  if (!root) return null;
  try {
    const models = await root.getDirectoryHandle(ROOT_DIR, { create });
    return await models.getDirectoryHandle(modelId, { create });
  } catch {
    return null;
  }
}

export async function hasModel(modelId: string, files: string[]): Promise<boolean> {
  const dir = await getModelDir(modelId);
  if (!dir) return false;
  for (const f of files) {
    try {
      await dir.getFileHandle(f);
    } catch {
      return false;
    }
  }
  return true;
}

export async function getModelStatus(modelId: string): Promise<ModelStatus | null> {
  const dir = await getModelDir(modelId);
  if (!dir) return null;
  let bytes = 0;
  const files: string[] = [];
  // @ts-expect-error - entries() exists on FileSystemDirectoryHandle
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === "file") {
      const file = await (handle as FileSystemFileHandle).getFile();
      bytes += file.size;
      files.push(name);
    }
  }
  return { modelId, bytes, files };
}

export async function deleteModel(modelId: string): Promise<boolean> {
  const root = await getOpfsRoot();
  if (!root) return false;
  try {
    const models = await root.getDirectoryHandle(ROOT_DIR, { create: false });
    // @ts-expect-error - removeEntry exists
    await models.removeEntry(modelId, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Download a single file with streaming + progress and write it into OPFS.
 * Existing files are overwritten.
 */
export async function downloadFileToOpfs(
  modelId: string,
  url: string,
  filename: string,
  onProgress?: (p: DownloadProgress) => void,
): Promise<boolean> {
  const dir = await getModelDir(modelId, true);
  if (!dir) throw new Error("OPFS not available");

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}) for ${url}`);
  }

  const total = Number(response.headers.get("content-length") || 0);
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  // @ts-expect-error - createWritable
  const writable = await fileHandle.createWritable();

  const reader = response.body.getReader();
  let loaded = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);
      loaded += value.byteLength;
      onProgress?.({
        modelId,
        file: filename,
        loaded,
        total,
        percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
      });
    }
  } finally {
    await writable.close();
  }
  return true;
}
