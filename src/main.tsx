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
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    if (import.meta.env.PROD) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      });
    } else {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          void reg.unregister();
        });
      }).catch(() => {});
    }
  }
} catch {
  // Ignore SecurityError in sandboxed or third-party-blocked iframes
}

createRoot(document.getElementById("root")!).render(<App />);
