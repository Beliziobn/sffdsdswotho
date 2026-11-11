import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  getSpecialAdminUser,
  isSpecialAdminLoggedIn,
  logoutSpecialAdmin,
} from "@/lib/editorialStore";

const ADMIN_EMAILS = ["miguelworscoi@gmail.com", "mongedoun327@gmail.com"];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => (getSpecialAdminUser() as unknown as User) ?? null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isSpecialAdminLoggedIn());

  useEffect(() => {
    const syncSpecialAdmin = (): boolean => {
      if (isSpecialAdminLoggedIn()) {
        const specialUser = getSpecialAdminUser() as unknown as User;
        setUser(specialUser);
        setIsAdmin(true);
        setLoading(false);
        return true;
      }
      return false;
    };

    if (syncSpecialAdmin()) {
      const handleAuthEvent = () => {
        if (!syncSpecialAdmin()) {
          setUser(null);
          setIsAdmin(false);
        }
      };
      window.addEventListener("worscoi_auth_updated", handleAuthEvent);
      return () => window.removeEventListener("worscoi_auth_updated", handleAuthEvent);
    }

    const checkRole = (userId: string | undefined, email?: string) => {
      const cleanEmail = (email || "").trim().toLowerCase();
      if (isSpecialAdminLoggedIn() || ADMIN_EMAILS.includes(cleanEmail)) {
        setIsAdmin(true);
        return;
      }
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      // Deferred to avoid deadlocks inside the auth callback
      setTimeout(async () => {
        const { data } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        setIsAdmin(!!data);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (syncSpecialAdmin()) return;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        checkRole(currentSession?.user?.id, currentSession?.user?.email);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (syncSpecialAdmin()) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      checkRole(initialSession?.user?.id, initialSession?.user?.email);
      setLoading(false);
    });

    const handleAuthUpdated = () => {
      if (!syncSpecialAdmin()) {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          setSession(s);
          setUser(s?.user ?? null);
          checkRole(s?.user?.id, s?.user?.email);
        });
      }
    };
    window.addEventListener("worscoi_auth_updated", handleAuthUpdated);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("worscoi_auth_updated", handleAuthUpdated);
    };
  }, []);

  const signOut = async () => {
    logoutSpecialAdmin();
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if offline
    }
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return { user, session, loading, isAdmin, signOut };
};

