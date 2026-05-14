import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPantryItems } from "./actions";
import { AddItemForm } from "./AddItemForm";
import { RemoveButton } from "./RemoveButton";

export const metadata = {
  title: "Pantry — Nekonomi",
  description: "Track what ingredients you currently have on hand.",
};

export default async function PantryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const items = await getPantryItems();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-50">
              📦 My Pantry
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {items.length === 0
                ? "No items yet — add your first ingredient below."
                : `${items.length} ingredient${items.length === 1 ? "" : "s"} on hand`}
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

        {/* Pantry list */}
        {items.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <th className="px-5 py-3">Ingredient</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Unit</th>
                  <th className="px-5 py-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.pantryId}
                    className={`transition hover:bg-slate-800/50 ${
                      i !== 0 ? "border-t border-slate-800/60" : ""
                    }`}
                  >
                    <td className="px-5 py-4 font-medium capitalize text-slate-100">
                      {item.name}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {item.quantity ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      {item.unit ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <RemoveButton pantryId={item.pantryId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
