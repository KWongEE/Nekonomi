// Availability Score: what fraction of a recipe's REQUIRED ingredients
// (optional ones are excluded entirely) are currently in the user's pantry.
// A recipe with zero required ingredients scores 100 — there's nothing
// required that's missing.
export function scoreRecipe(owned: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((owned / total) * 100);
}
