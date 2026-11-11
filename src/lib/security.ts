import { supabase } from "@/integrations/supabase/client";

export type AuditEvent =
  | "login_success"
  | "logout"
  | "signup"
  | "password_reset_requested"
  | "password_changed"
  | "terms_accepted"
  | "cookie_consent"
  | "payment_started"
  | "payment_completed";

/** Records a critical action in the server-side audit log (fire and forget). */
export async function logAudit(
  event: AuditEvent,
  payload: { entity?: string; entityId?: string; metadata?: Record<string, unknown>; email?: string } = {},
) {
  try {
    await supabase.functions.invoke("auth-guard", {
      body: { action: "log", event, ...payload },
    });
  } catch (error) {
    console.warn("audit log failed", error);
  }
}

/** Asks the server whether this IP/e-mail pair may still attempt to sign in. */
export async function checkLoginRateLimit(email: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    const { data, error } = await supabase.functions.invoke("auth-guard", {
      body: { action: "check-rate-limit", email },
    });
    if (error) return { allowed: true };
    return data as { allowed: boolean; retryAfterSeconds?: number };
  } catch {
    return { allowed: true };
  }
}

/** Registers a failed sign-in attempt so brute-force attacks get throttled. */
export async function recordLoginFailure(email: string) {
  try {
    await supabase.functions.invoke("auth-guard", {
      body: { action: "record-failure", email },
    });
  } catch {
    /* ignore */
  }
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3 | 4; label: string };

export function passwordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
  const labels = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
  const clamped = Math.min(score, 4) as PasswordStrength["score"];
  return { score: clamped, label: labels[clamped] };
}
