import { describe, it, expect } from "vitest";
import { accrueCompoundAnnual } from "@/lib/yield";

describe("yield math (compound annual)", () => {
  it("hits principal*(1+r) after exactly 365 days", () => {
    const principal = 1000;
    const r = 0.10;
    const ms = 365 * 24 * 60 * 60 * 1000;
    const out = accrueCompoundAnnual({ principal, annualRateDecimal: r, elapsedMs: ms });
    expect(out).toBeCloseTo(1100, 10);
  });

  it("is deterministic for same inputs", () => {
    const principal = 1234.56;
    const r = 0.045;
    const ms = 30 * 24 * 60 * 60 * 1000;
    const a = accrueCompoundAnnual({ principal, annualRateDecimal: r, elapsedMs: ms });
    const b = accrueCompoundAnnual({ principal, annualRateDecimal: r, elapsedMs: ms });
    expect(a).toBe(b);
  });
});

