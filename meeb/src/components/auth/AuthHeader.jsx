export default function AuthHeader({ title, subtitle }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-neutral-500">{subtitle}</p>
    </div>
  );
}
