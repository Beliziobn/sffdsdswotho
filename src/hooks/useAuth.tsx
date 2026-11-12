import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { auth as firebaseAuth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import {
  getSpecialAdminUser,
  isSpecialAdminLoggedIn,
  logoutSpecialAdmin,
} from "@/lib/editorialStore";

const ADMIN_EMAILS = [
  "miguelworscoi@gmail.com",
  "mongedoun327@gmail.com",
  "socienciadaeduca2018@gmail.com",
];

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
      setTimeout(async () => {
        try {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();
          setIsAdmin(!!data);
        } catch {
          // Ignore if offline
        }
      }, 0);
    };

    const unsubFirebase = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (syncSpecialAdmin()) return;
      if (fbUser && !fbUser.isAnonymous) {
        const mappedUser = {
          id: fbUser.uid,
          email: fbUser.email || "",
          app_metadata: { provider: "google" },
          user_metadata: {
            display_name: fbUser.displayName || fbUser.email?.split("@")[0] || "Leitor Wotho",
            avatar_url: fbUser.photoURL || undefined,
          },
          aud: "authenticated",
          created_at: fbUser.metadata?.creationTime || new Date().toISOString(),
        } as unknown as User;
        setUser(mappedUser);
        checkRole(fbUser.uid, fbUser.email || undefined);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (syncSpecialAdmin()) return;
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          checkRole(currentSession.user.id, currentSession.user.email);
          setLoading(false);
        } else if (!firebaseAuth.currentUser || firebaseAuth.currentUser.isAnonymous) {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (syncSpecialAdmin()) return;
      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        checkRole(initialSession.user.id, initialSession.user.email);
      }
      setLoading(false);
    });

    const handleAuthUpdated = () => {
      if (!syncSpecialAdmin()) {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
          if (s?.user) {
            setSession(s);
            setUser(s.user);
            checkRole(s.user.id, s.user.email);
          } else if (firebaseAuth.currentUser && !firebaseAuth.currentUser.isAnonymous) {
            const fbUser = firebaseAuth.currentUser;
            setUser({
              id: fbUser.uid,
              email: fbUser.email || "",
              app_metadata: { provider: "google" },
              user_metadata: {
                display_name: fbUser.displayName || fbUser.email?.split("@")[0] || "Leitor Wotho",
                avatar_url: fbUser.photoURL || undefined,
              },
              aud: "authenticated",
              created_at: fbUser.metadata?.creationTime || new Date().toISOString(),
            } as unknown as User);
            checkRole(fbUser.uid, fbUser.email || undefined);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        });
      }
    };
    window.addEventListener("worscoi_auth_updated", handleAuthUpdated);

    return () => {
      unsubFirebase();
      subscription.unsubscribe();
      window.removeEventListener("worscoi_auth_updated", handleAuthUpdated);
    };
  }, []);

  const signOut = async () => {
    logoutSpecialAdmin();
    try {
      await firebaseSignOut(firebaseAuth);
    } catch {
      // Ignore
    }
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


