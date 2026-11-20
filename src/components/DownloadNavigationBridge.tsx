import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DOWNLOAD_NAVIGATE_EVENT } from "@/lib/downloadNotifications";

export default function DownloadNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ href?: string }>;
      const href = custom.detail?.href;
      if (href) {
        navigate(href);
      }
    };
    window.addEventListener(DOWNLOAD_NAVIGATE_EVENT, handler);
    return () => window.removeEventListener(DOWNLOAD_NAVIGATE_EVENT, handler);
  }, [navigate]);

  return null;
}
