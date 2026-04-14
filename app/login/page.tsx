"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const nextPath = search.get("next") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "login failed");
        return;
      }
      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl"
    >
      <h1 className="text-2xl font-semibold">IR Validator</h1>
      <p className="text-sm text-white/60">Sign in to continue.</p>

      <label className="block text-sm">
        <span className="mb-1 block text-white/70">Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30"
          required
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-white/70">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-white/30"
          required
        />
      </label>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black transition disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
