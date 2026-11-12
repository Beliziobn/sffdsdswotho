import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  disableNetwork,
  enableNetwork,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with forced long-polling to avoid WebChannel streaming stalls behind proxies/iframes
let dbInstance;
try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true,
      ignoreUndefinedProperties: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = dbInstance;

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

let firestoreNetworkAvailable = true;
let connectionCheckPromise: Promise<boolean> | null = null;
let lastCheckTs = 0;

async function probeFirestoreBackend(timeoutMs = 4000): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }
  if (typeof fetch !== "function") {
    return true;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const dbPath = `projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}`;
    const url = `https://firestore.googleapis.com/v1/${dbPath}/documents:batchGet?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ documents: [`${dbPath}/documents/test/connection`] }),
      signal: controller.signal,
    });
    return res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

// Connection test on boot per firebase-integration-rpc skill, guarded below Firestore's 10s OnlineStateTracker timeout
async function testConnection(): Promise<boolean> {
  lastCheckTs = Date.now();
  const reachable = await probeFirestoreBackend(4000);
  if (!reachable) {
    firestoreNetworkAvailable = false;
    await disableNetwork(db).catch(() => {});
    return false;
  }

  let guardTimer: ReturnType<typeof setTimeout> | null = null;
  let timedOut = false;

  const guardPromise = new Promise<boolean>((resolve) => {
    guardTimer = setTimeout(async () => {
      timedOut = true;
      firestoreNetworkAvailable = false;
      await disableNetwork(db).catch(() => {});
      resolve(false);
    }, 6500);
  });

  const serverCheckPromise = (async () => {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
      if (!timedOut) {
        firestoreNetworkAvailable = true;
      }
      return !timedOut;
    } catch (error) {
      if (!timedOut && error instanceof Error && error.message.includes("the client is offline")) {
        firestoreNetworkAvailable = false;
        await disableNetwork(db).catch(() => {});
        return false;
      }
      return !timedOut;
    } finally {
      if (guardTimer) {
        clearTimeout(guardTimer);
        guardTimer = null;
      }
    }
  })();

  return Promise.race([serverCheckPromise, guardPromise]);
}

export function ensureFirestoreReady(): Promise<boolean> {
  if (!connectionCheckPromise) {
    connectionCheckPromise = testConnection();
  }
  return connectionCheckPromise;
}

export async function ensureFirestoreOnline(): Promise<boolean> {
  const ready = await ensureFirestoreReady();
  if (ready) return true;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return false;
  }
  if (Date.now() - lastCheckTs < 15_000) {
    return false;
  }
  await enableNetwork(db).catch(() => {});
  connectionCheckPromise = testConnection();
  return connectionCheckPromise;
}

export function isFirestoreAvailable(): boolean {
  return firestoreNetworkAvailable;
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    lastCheckTs = 0;
    connectionCheckPromise = null;
    void ensureFirestoreOnline();
  });
}

void ensureFirestoreReady();
