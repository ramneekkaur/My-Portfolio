"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Owner sign-in for the photo uploader. The password is checked on the
// server, which sets a signed session cookie; nothing is stored in the browser.
export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("Verifying...");
    try {
      const response = await fetch("/api/garden/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setStatus(data.error || "Sign-in failed.");
        return;
      }
      setStatus("Access granted.");
      setPassword("");
      router.refresh();
    } catch {
      setStatus("Something interrupted the connection.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel mx-auto mt-12 max-w-md space-y-6 p-6 pt-9 md:p-8 md:pt-10">
      <p className="panel-title">[ Owner access ]</p>
      <label className="block">
        <span className="term-label mb-2 block">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="field-terminal"
          required
        />
      </label>
      <button type="submit" disabled={busy} className="btn-terminal btn-terminal-primary disabled:opacity-50">
        Sign in
      </button>
      <p aria-live="polite" className="min-h-[1.25rem] text-xs uppercase tracking-wider text-phosphor">
        {status && <>&gt; {status}</>}
      </p>
    </form>
  );
}
