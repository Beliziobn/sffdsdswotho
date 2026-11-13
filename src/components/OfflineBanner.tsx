import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine === false : false
  );

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[190] flex items-center gap-2.5 rounded-full border border-white/15 bg-zinc-950/95 px-4 py-2 text-xs text-zinc-100 shadow-lg backdrop-blur-md"
    >
      <WifiOff className="h-3.5 w-3.5 text-amber-400 shrink-0" />
      <span className="whitespace-nowrap font-light">
        Sem conexão com a internet · Alguns conteúdos dependem de rede
      </span>
    </div>
  );
};

export default OfflineBanner;
