import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

declare global {
  interface Window {
    __WOTHO_APP_MOUNTED__?: boolean;
  }
}

window.__WOTHO_APP_MOUNTED__ = true;

try {
  if (typeof window !== "undefined") {
    const refMeta = document.querySelector('meta[name="referrer"]') as HTMLMetaElement | null;
    if (refMeta && refMeta.content === "no-referrer") {
      refMeta.content = "strict-origin-when-cross-origin";
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((reg) => {
            void reg.unregister();
          });
        })
        .catch(() => {});
    }
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((key) => {
            if (key.startsWith("wotho-")) {
              void caches.delete(key);
            }
          });
        })
        .catch(() => {});
    }
  }
} catch {
  // Ignore SecurityError in sandboxed or third-party-blocked iframes
}

createRoot(document.getElementById("root")!).render(<App />);
