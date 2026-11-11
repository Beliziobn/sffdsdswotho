import { useEffect, useState } from "react";

/**
 * Regra de bloqueio de redirecionamento e popups durante a reprodução do player.
 * Intercepta window.open, eventos da Navigation API (navegação externa forçada por iframes),
 * beforeunload não intencional e roubo de foco (popunders).
 */
export function usePlayerAdBlock(active: boolean = true) {
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

    const originalOpen = window.open;

    // 1. Neutraliza completamente window.open enquanto o player está ativo
    window.open = function (..._args: Parameters<typeof window.open>) {
      setBlockedCount((c) => c + 1);
      return null;
    };

    // 2. Intercepta tentativas de redirecionamento via Navigation API (Chrome/Edge/Chromium)
    const nav = (window as unknown as { navigation?: EventTarget }).navigation;
    const handleNavigate = (event: Event) => {
      const navEvent = event as unknown as {
        destination?: { url?: string };
        canIntercept?: boolean;
        preventDefault: () => void;
      };
      const destUrl = navEvent.destination?.url;
      if (!destUrl) return;
      try {
        const parsed = new URL(destUrl, window.location.origin);
        // Bloqueia qualquer tentativa de redirecionar a janela principal para outro domínio
        if (parsed.origin !== window.location.origin) {
          navEvent.preventDefault();
          setBlockedCount((c) => c + 1);
        }
      } catch {
        // ignore URL parse error
      }
    };

    if (nav && typeof nav.addEventListener === "function") {
      nav.addEventListener("navigate", handleNavigate);
    }

    // 3. Impede popunders / roubo de foco após clique no iframe
    const handleBlur = () => {
      setTimeout(() => {
        try {
          window.focus();
        } catch {
          // ignore
        }
      }, 30);
    };

    // 4. Bloqueia tentativa de redirecionamento de topo (top-level unload hijacking) vinda do iframe
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (document.activeElement?.tagName === "IFRAME") {
        e.preventDefault();
        e.returnValue = "";
        setBlockedCount((c) => c + 1);
      }
    };

    // 5. Bloqueia cliques em links ocultos injetados dinamicamente fora do domínio
    const handleGlobalClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest?.("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;
      try {
        const parsed = new URL(href, window.location.origin);
        const isAllowedExternal =
          parsed.hostname.includes("imdb.com") || parsed.hostname.includes("themoviedb.org");
        if (parsed.origin !== window.location.origin && !isAllowedExternal) {
          e.preventDefault();
          e.stopPropagation();
          setBlockedCount((c) => c + 1);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleGlobalClick, true);

    return () => {
      window.open = originalOpen;
      if (nav && typeof nav.removeEventListener === "function") {
        nav.removeEventListener("navigate", handleNavigate);
      }
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleGlobalClick, true);
    };
  }, [active]);

  return { blockedCount };
}

