import { useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Sign in" : "Create account"),
    [mode]
  );

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err) {
      setError(err?.message ?? "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-xl backdrop-blur">
        <div className="space-y-2">
          <div className="text-sm text-neutral-400">Shared Spending</div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-400">
            {mode === "login"
              ? "Welcome back. Sign in to continue."
              : "Create an account to start tracking together."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-base outline-none placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-2 focus:ring-neutral-700"
              placeholder="Email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="sr-only">Password</span>
            <input
              className="w-full rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-3 text-base outline-none placeholder:text-neutral-600 focus:border-neutral-600 focus:ring-2 focus:ring-neutral-700"
              placeholder="Password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-white text-neutral-900 py-3 font-medium active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
          </button>

          <button
            type="button"
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-950 py-3 text-sm text-neutral-200 hover:bg-neutral-900/60 active:scale-[0.99]"
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "signup" : "login");
            }}
          >
            {mode === "login"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>

          <p className="pt-2 text-xs text-neutral-500 leading-relaxed">
            Tip: keep inputs at 16px+ (Tailwind <code>text-base</code>) to avoid
            iOS Safari auto-zoom on focus.
          </p>
        </form>
      </div>
    </div>
  );
}
