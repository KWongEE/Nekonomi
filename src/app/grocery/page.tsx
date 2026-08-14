import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getGroceryList } from "./actions";
import type { IngredientCategory } from "@/db/schema";

export const metadata = {
  title: "Grocery List — Nekonomi",
  description: "What you need to buy for your planned meals.",
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

export default async function GroceryListPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await getGroceryList();

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

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            🛒 Grocery List
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {items.length === 0
              ? "Nothing on your list — plan a meal to get started."
              : `${items.length} item${items.length === 1 ? "" : "s"} across ${activeCategories.length} aisle${activeCategories.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Grocery list grouped by category */}
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
            {grouped[category].map((item, i) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 px-5 py-4 ${
                  i !== 0 ? "border-t border-slate-800/60" : ""
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium capitalize text-slate-100">{item.name}</p>
                    <span className="shrink-0 text-xs text-slate-400">
                      {item.quantity ?? "—"} {item.unit ?? ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 p-10 text-center text-slate-500">
            Your grocery list is empty.
          </div>
        )}
      </div>
    </div>
  );
}
