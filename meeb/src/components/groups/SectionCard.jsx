export default function SectionCard({ title, description, children }) {
  return (
    <section className="rounded-3xl border border-[#e6dfd4] bg-white p-5 shadow-sm">
      {(title || description) && (
        <header className="space-y-1">
          {title ? <h2 className="text-lg font-semibold tracking-tight">{title}</h2> : null}
          {description ? <p className="text-sm text-neutral-500">{description}</p> : null}
        </header>
      )}
      <div className={title || description ? "mt-4" : ""}>{children}</div>
    </section>
  );
}
