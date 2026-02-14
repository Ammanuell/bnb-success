import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

export default function GroupsHeader({
  email,
  createOpen,
  joinOpen,
  onToggleCreate,
  onToggleJoin,
}) {
  return (
    <header className="flex items-start justify-between gap-4 rounded-3xl border border-[#e6dfd4] bg-white p-4 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Your Groups</h1>
        <p className="mt-1 text-xs text-neutral-500">{email}</p>
        <button
          onClick={() => signOut(auth)}
          className="mt-2 text-xs text-neutral-500 underline-offset-2 hover:underline"
        >
          Sign out
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleCreate}
          className={`rounded-xl border px-3 py-1.5 text-xs transition active:scale-[0.99] ${
            createOpen
              ? "border-[#d6cbbd] bg-[#f2ece4] text-neutral-800"
              : "border-[#e6dfd4] bg-[#faf7f2] text-neutral-700 hover:bg-[#f2ece4]"
          }`}
        >
          Create group
        </button>
        <button
          onClick={onToggleJoin}
          className={`rounded-xl border px-3 py-1.5 text-xs transition active:scale-[0.99] ${
            joinOpen
              ? "border-[#d6cbbd] bg-[#f2ece4] text-neutral-800"
              : "border-[#e6dfd4] bg-[#faf7f2] text-neutral-700 hover:bg-[#f2ece4]"
          }`}
        >
          Join group
        </button>
      </div>
    </header>
  );
}
