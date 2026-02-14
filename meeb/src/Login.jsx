import { useMemo, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";
import AuthButton from "./components/auth/AuthButton";
import AuthCard from "./components/auth/AuthCard";
import AuthHeader from "./components/auth/AuthHeader";
import AuthInput from "./components/auth/AuthInput";

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

  const subtitle =
    mode === "login"
      ? "Welcome back. Sign in to continue."
      : "Create an account to start tracking together.";

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
    <AuthCard>
      <AuthHeader title={title} subtitle={subtitle} />

      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <label className="block">
          <span className="sr-only">Email</span>
          <AuthInput
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
          <AuthInput
            placeholder="Password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
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

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Sign up"}
        </AuthButton>

        <AuthButton
          type="button"
          variant="secondary"
          onClick={() => {
            setError("");
            setMode(mode === "login" ? "signup" : "login");
          }}
        >
          {mode === "login"
            ? "Need an account? Create one"
            : "Already have an account? Sign in"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
