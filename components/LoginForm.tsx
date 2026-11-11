"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useT } from "./I18n";

export function LoginForm({ next = "/" }: { next?: string }) {
  const { t, lang } = useT();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const sb = supabaseBrowser();
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  if (!sb) return <p className="empty">{t.login.notConfigured}</p>;

  async function google() {
    setError(null);
    const { error } = await sb!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
    if (error) setError(error.message.includes("not enabled") ? t.login.googleOff : error.message);
  }

  async function byEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setState("sending");
    const { error } = await sb!.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirectTo() } });
    if (error) { setState("idle"); setError(error.message.toLowerCase().includes("rate") ? t.login.rate : error.message); return; }
    setState("sent");
  }

  return (
    <div className="login-card">
      <button className="btn google" onClick={google} type="button">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12S6.6 21.7 12 21.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z"/></svg>
        {t.login.google}
      </button>
      <div className="or"><span>{t.login.orEmail}</span></div>
      {state === "sent" ? (
        <p className="sent">{t.login.sent(email)}</p>
      ) : (
        <form onSubmit={byEmail} className="login-email">
          <label className="lbl" htmlFor="email">{t.login.email}</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={lang === "en" ? "you@email.com" : "tu@email.com"} autoComplete="email" />
          <button className="btn primary" disabled={state === "sending"}>{state === "sending" ? t.login.sending : t.login.sendLink}</button>
        </form>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>{t.login.noPasswords}</p>
    </div>
  );
}
