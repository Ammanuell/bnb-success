export default function AuthButton({ variant = "primary", className, ...props }) {
  const variantClassName =
    variant === "secondary"
      ? "text-sm text-neutral-700 hover:bg-[#f2ece4]"
      : "text-neutral-900 font-medium hover:bg-[#cfc4b8] disabled:opacity-60";

  const baseClassName =
    "w-full rounded-2xl border border-[#e6dfd4] bg-[#faf7f2] py-3 active:scale-[0.99] disabled:active:scale-100 transition";

  return (
    <button className={`${baseClassName} ${variantClassName} ${className ?? ""}`.trim()} {...props} />
  );
}
