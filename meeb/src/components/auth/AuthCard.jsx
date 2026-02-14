export default function AuthCard({ children }) {
  return (
    <div className="min-h-dvh bg-[#f5f1ea] text-neutral-800 flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl border border-[#e6dfd4] bg-white p-6 shadow-lg">
        {children}
      </div>
    </div>
  );
}
