export default function AuthInput({ className, ...props }) {
  const baseClassName =
    "w-full rounded-2xl bg-[#faf7f2] border border-[#e6dfd4] px-4 py-3 text-base outline-none placeholder:text-neutral-400 focus:border-[#d6cbbd] focus:ring-2 focus:ring-[#e8dfd3]";

  return <input className={`${baseClassName} ${className ?? ""}`.trim()} {...props} />;
}
