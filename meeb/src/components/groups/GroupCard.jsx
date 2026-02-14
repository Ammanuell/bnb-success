import { Link } from "react-router-dom";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' rx='12' fill='%23f5f1ea'/%3E%3Cg fill='%234285F4'%3E%3Ccircle cx='16' cy='18' r='5'/%3E%3Ccircle cx='32' cy='18' r='5'/%3E%3Cpath d='M8 33c0-4.4 5.4-7 8-7s8 2.6 8 7v3H8v-3z'/%3E%3Cpath d='M24 33c0-4.4 5.4-7 8-7s8 2.6 8 7v3H24v-3z'/%3E%3C/g%3E%3C/svg%3E";

export default function GroupCard({ group }) {
  return (
    <Link
      to={`/groups/${group.id}`}
      className="block rounded-3xl border border-[#e6dfd4] bg-[#faf7f2] p-4 transition hover:bg-[#f2ece4]"
    >
      <div className="flex items-start gap-4">
        <img
          src={group.pictureUrl || FALLBACK_IMAGE}
          alt={group.name}
          className="h-16 w-16 rounded-2xl border border-[#e6dfd4] bg-white object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold tracking-tight">{group.name}</h3>
          <p className="mt-1 text-xs text-neutral-600">{group.description}</p>
          <p className="mt-2 text-[11px] text-neutral-500">Owner: {group.owner}</p>
        </div>
      </div>
    </Link>
  );
}
