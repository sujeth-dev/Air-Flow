/* ============================================================
 * Persistence — recordings (IndexedDB).
 *
 * Stores MediaRecorder Blobs in IndexedDB so clips survive page
 * reloads. Stage 2 wires this to a Gallery view; today the Studio
 * still downloads + offers per-clip persistence on demand.
 * ========================================================== */

const DB_NAME = 'airflow-recordings';
const DB_VERSION = 1;
const STORE = 'clips';

export interface Recording {
  id: string;
  createdAt: number;
  durationMs: number;
  blob: Blob;
  /** Pack id active when the clip was captured. */
  packId?: string;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveRecording(rec: Recording): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listRecordings(): Promise<Recording[]> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => {
      const all = (req.result as Recording[]) ?? [];
      resolve(all.sort((a, b) => b.createdAt - a.createdAt));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
