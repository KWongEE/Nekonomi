import Link from "next/link";

export function HomeLink() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition hover:text-amber-400"
    >
      🍱 Nekonomi
    </Link>
  );
}
