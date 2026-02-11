import { signOut } from "firebase/auth";
import { auth } from "./firebase";

export default function Home() {
  const user = auth.currentUser;

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-50 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-sm text-neutral-400">Shared Spending</div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          </div>

          <button
            onClick={() => signOut(auth)}
            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-sm hover:bg-neutral-900 active:scale-[0.99]"
          >
            Sign out
          </button>
        </header>

        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-6">
          <div className="text-sm text-neutral-400">Signed in as</div>
          <div className="mt-1 text-lg font-medium">{user?.email}</div>
          <div className="mt-4 text-sm text-neutral-400">
            Next: we’ll create your first <span className="text-neutral-200">group</span> and
            start saving <span className="text-neutral-200">expenses</span> in Firestore.
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/30 p-5">
            <div className="text-sm text-neutral-400">Total spend</div>
            <div className="mt-2 text-3xl font-semibold">$0</div>
          </div>
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/30 p-5">
            <div className="text-sm text-neutral-400">You owe / owed</div>
            <div className="mt-2 text-3xl font-semibold">$0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
