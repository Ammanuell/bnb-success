import { useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
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
    <div className="min-h-dvh bg-[#f5f1ea] text-neutral-800 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-[#e6dfd4] bg-white p-6 shadow-lg">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-500">
            {mode === "login"
              ? "Welcome back. Sign in to continue."
              : "Create an account to start tracking together."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              className="w-full rounded-2xl bg-[#faf7f2] border border-[#e6dfd4] px-4 py-3 text-base outline-none placeholder:text-neutral-400 focus:border-[#d6cbbd] focus:ring-2 focus:ring-[#e8dfd3]"
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
            <input
              className="w-full rounded-2xl bg-[#faf7f2] border border-[#e6dfd4] px-4 py-3 text-base outline-none placeholder:text-neutral-400 focus:border-[#d6cbbd] focus:ring-2 focus:ring-[#e8dfd3]"
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
            <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-[#e6dfd4] bg-[#faf7f2]  text-neutral-900 py-3 font-medium hover:bg-[#cfc4b8] active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100 transition"
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
          </button>

          <button
            type="button"
            className="w-full rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] py-3 text-sm text-neutral-700 hover:bg-[#f2ece4] active:scale-[0.99] transition"
            onClick={() => {
              setError("");
              setMode(mode === "login" ? "signup" : "login");
            }}
          >
            {mode === "login"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>

        </form>
      </div>
    </div>
  );
}
