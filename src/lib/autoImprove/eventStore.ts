import type { BehaviorEvent } from "./types";

const DB_NAME = "shadowtalk-auto-improve";
const STORE = "events";
const DB_VERSION = 1;
const MAX_EVENTS = 300;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
  });
}

export async function appendBehaviorEvent(event: BehaviorEvent): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.put(event);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  const all = await getBehaviorEvents(MAX_EVENTS + 50);
  if (all.length > MAX_EVENTS) {
    const toDelete = all.slice(0, all.length - MAX_EVENTS);
    const db2 = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db2.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      for (const e of toDelete) store.delete(e.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  db.close();
}

export async function getBehaviorEvents(limit = MAX_EVENTS): Promise<BehaviorEvent[]> {
  const db = await openDb();
  const events = await new Promise<BehaviorEvent[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as BehaviorEvent[]) || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return events.sort((a, b) => a.ts - b.ts).slice(-limit);
}

export async function clearBehaviorEvents(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
