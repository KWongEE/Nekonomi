import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPantryItems } from "./actions";
import { AddItemForm } from "./AddItemForm";
import { RemoveButton } from "./RemoveButton";
import { HomeLink } from "@/components/HomeLink";
import type { IngredientCategory } from "@/db/schema";

export const metadata = {
  title: "Pantry — Nekonomi",
  description: "Track what ingredients you currently have on hand.",
};

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  produce: "🥦 Produce",
  dairy: "🥛 Dairy",
  meat_seafood: "🥩 Meat & Seafood",
  bakery: "🍞 Bakery",
  frozen: "🧊 Frozen",
  dry_goods: "🌾 Dry Goods",
  beverages: "🥤 Beverages",
  condiments: "🧴 Condiments",
  snacks: "🍿 Snacks",
  other: "📦 Other",
};

// Order aisles appear on the page
const CATEGORY_ORDER: IngredientCategory[] = [
  "produce", "dairy", "meat_seafood", "bakery", "frozen",
  "dry_goods", "beverages", "condiments", "snacks", "other",
];

export default async function PantryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await getPantryItems();

  // Group items by category
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = item.category ?? "other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const activeCategories = CATEGORY_ORDER.filter((c) => grouped[c]?.length);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-8">

        <HomeLink />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              📦 My Pantry
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {items.length === 0
                ? "No items yet — add your first ingredient below."
                : `${items.length} ingredient${items.length === 1 ? "" : "s"} across ${activeCategories.length} aisle${activeCategories.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Hi, {session.user.name?.split(" ")[0] ?? session.user.email} 👋
          </span>
        </div>

        {/* Add item form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
            Add Ingredient
          </h2>
          <AddItemForm />
        </div>

        {/* Pantry grouped by category */}
        {activeCategories.map((category) => (
          <div key={category} className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-800 px-5 py-3">
              <h2 className="text-sm font-semibold text-slate-300">
                {CATEGORY_LABELS[category]}
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({grouped[category].length})
                </span>
              </h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-widest text-slate-600">
                  <th className="px-5 py-2">Ingredient</th>
                  <th className="px-5 py-2">Qty</th>
                  <th className="px-5 py-2">Unit</th>
                  <th className="px-5 py-2 text-right">Remove</th>
                </tr>
              </thead>
              <tbody>
                {grouped[category].map((item, i) => (
                  <tr
                    key={item.pantryId}
                    className={`transition hover:bg-slate-800/50 ${
                      i !== 0 ? "border-t border-slate-800/60" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-medium capitalize text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {item.quantity ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {item.unit ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RemoveButton pantryId={item.pantryId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-slate-500">
            Your pantry is empty. Add something above to get started!
          </div>
        )}
      </div>
    </div>
  );
}
