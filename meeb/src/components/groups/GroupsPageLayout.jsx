export default function GroupsPageLayout({ children }) {
  return (
    <div className="h-dvh bg-[#f5f1ea] text-neutral-800 p-4 sm:p-6">
      <div className="mx-auto h-full w-full max-w-5xl">{children}</div>
    </div>
  );
}
