import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Nekonomi",
  description: "Your pantry, recipes, and grocery list — all in one place.",
};

const FEATURES = [
  {
    href: "/pantry",
    icon: "📦",
    label: "Pantry",
    description: "Track what ingredients you have on hand",
  },
  {
    href: "/recipes",
    icon: "🍳",
    label: "Recipes",
    description: "Browse recipes, sorted by what you can make right now",
  },
  {
    href: "/grocery",
    icon: "🛒",
    label: "Grocery List",
    description: "See what's missing for your planned meals",
  },
  {
    href: "/household",
    icon: "🏠",
    label: "Household",
    description: "Share your pantry, recipes, and grocery list with others",
  },
];

export default async function Home() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            🍱 Nekonomi
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Hi, {session.user.name?.split(" ")[0] ?? session.user.email} — what would you like to do?
          </p>
        </div>

        {/* Feature links */}
        <div className="flex flex-col gap-4">
          {FEATURES.map((feature) => (
            <Link
              key={feature.href}
              href={feature.href}
              className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900 px-5 py-6 transition hover:border-amber-400/40 hover:bg-slate-800/50 active:scale-[0.99]"
            >
              <span className="text-3xl">{feature.icon}</span>
              <div>
                <p className="font-semibold text-slate-50">{feature.label}</p>
                <p className="mt-0.5 text-sm text-slate-400">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
