import { describe, it, expect } from "vitest";
import { scoreRecipe } from "./scoring";

describe("scoreRecipe", () => {
  it("computes exact percentages", () => {
    expect(scoreRecipe(3, 4)).toBe(75);
    expect(scoreRecipe(4, 4)).toBe(100);
    expect(scoreRecipe(0, 4)).toBe(0);
  });

  it("returns 100 when there are no required ingredients", () => {
    expect(scoreRecipe(0, 0)).toBe(100);
  });

  it("rounds to the nearest integer", () => {
    expect(scoreRecipe(1, 3)).toBe(33); // 33.33...
    expect(scoreRecipe(2, 3)).toBe(67); // 66.66...
  });
});
