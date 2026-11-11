import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/security";
import { useAuth } from "@/hooks/useAuth";

export const TERMS_VERSION = "1.0";
export const COOKIE_STORAGE_KEY = "worscoi.cookie-consent.v1";

export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export function readCookiePreferences(): CookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CookiePreferences) : null;
  } catch {
    return null;
  }
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(() => readCookiePreferences());

  const save = useCallback((prefs: Omit<CookiePreferences, "necessary">) => {
    const value: CookiePreferences = { necessary: true, ...prefs };
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(value));
    setPreferences(value);
    void logAudit("cookie_consent", { metadata: value as unknown as Record<string, unknown> });
    window.dispatchEvent(new CustomEvent("worscoi:cookie-consent", { detail: value }));
  }, []);

  return { preferences, decided: preferences !== null, save };
}

export const TERMS_STORAGE_KEY = "worscoi.terms-consent.v1";

function hasLocalTermsConsent(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(`${TERMS_STORAGE_KEY}.${userId}`);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.version === TERMS_VERSION && parsed?.accepted === true;
  } catch {
    return false;
  }
}

function saveLocalTermsConsent(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${TERMS_STORAGE_KEY}.${userId}`,
      JSON.stringify({ accepted: true, version: TERMS_VERSION, acceptedAt: new Date().toISOString() })
    );
  } catch {
    // Ignore storage error
  }
}

export function useTermsConsent() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
    if (!user) {
      setAccepted(null);
      return;
    }

    // Master Admin or locally accepted users never get blocked by the terms dialog
    if (
      isAdmin ||
      user.id === "master-admin-miguel-worscoi" ||
      user.email?.toLowerCase() === "miguelworscoi@gmail.com" ||
      hasLocalTermsConsent(user.id)
    ) {
      setAccepted(true);
      return;
    }

    (async () => {
      try {
        const { data } = await supabase
          .from("user_consents")
          .select("terms_accepted, privacy_accepted, terms_version")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .maybeSingle();
        if (cancelled) return;
        const isOk =
          !!data?.terms_accepted && !!data?.privacy_accepted && data?.terms_version === TERMS_VERSION;
        if (isOk) {
          saveLocalTermsConsent(user.id);
        }
        setAccepted(isOk);
      } catch {
        if (!cancelled) setAccepted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, authLoading]);

  const accept = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    saveLocalTermsConsent(user.id);
    setAccepted(true);
    try {
      if (user.id !== "master-admin-miguel-worscoi") {
        await supabase.from("user_consents").upsert(
          {
            user_id: user.id,
            email: user.email ?? null,
            terms_accepted: true,
            privacy_accepted: true,
            terms_version: TERMS_VERSION,
            accepted_at: new Date().toISOString(),
            cookie_preferences: (readCookiePreferences() ?? {}) as never,
          },
          { onConflict: "user_id" },
        );
      }
      void logAudit("terms_accepted", { metadata: { version: TERMS_VERSION } });
    } catch {
      // Fallback already persisted locally
    } finally {
      setSaving(false);
    }
  }, [user]);

  return { needsAcceptance: !!user && !isAdmin && accepted === false, accept, saving };
}

