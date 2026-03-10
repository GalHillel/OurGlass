import { describe, it, expect } from "vitest";
import { calculateLiveBalance } from "./wealth-utils";

describe("calculateLiveBalance", () => {
    const startDate = "2024-01-01T00:00:00.000Z";

    it("calculates simple compounding correctly for exactly 365.25 days", () => {
        // P = 1000, r = 10%, t = 1 year
        // Expected: 1000 * (1.1)^1 = 1100
        const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
        const oneYearLater = new Date(new Date(startDate).getTime() + msPerYear);
        const result = calculateLiveBalance(1000, startDate, 10, 0, [], oneYearLater);
        expect(Math.round(result)).toBe(1100);
    });

    it("handles fractional years (6 months)", () => {
        // P = 1000, r = 10%, t = 0.5 year
        // Expected: 1000 * (1.1)^0.5 ≈ 1048.81
        const sixMonthsLater = "2024-07-02T00:00:00.000Z"; // Slightly more than 0.5 to be safe
        const result = calculateLiveBalance(1000, startDate, 10, 0, [], sixMonthsLater);
        expect(result).toBeGreaterThan(1048);
        expect(result).toBeLessThan(1050);
    });

    it("deducts tax from profit only", () => {
        // P = 1000, r = 10%, t = 1 year, tax = 15%
        // Profit = 100
        // Tax = 100 * 0.15 = 15
        // Result = 1100 - 15 = 1085
        const oneYearLater = "2025-01-01T00:00:00.000Z";
        const result = calculateLiveBalance(1000, startDate, 10, 15, [], oneYearLater);
        expect(Math.round(result)).toBe(1085);
    });

    it("handles an exit date with withdrawal", () => {
        // Start: 1000, Rate: 10%
        // Exit Date: 6 months later, withdraw 500
        // Date: 1 year later

        // 1. At 6 months: Bal ≈ 1048.81. Profit ≈ 48.81.
        // 2. Tax on profit (0% for simplicity here): Bal = 1048.81
        // 3. Withdraw 500: New Principal = 548.81
        // 4. Next 6 months: 548.81 * (1.1)^0.5 ≈ 548.81 * 1.0488 ≈ 575.59

        const exitDate = "2024-07-01T00:00:00.000Z";
        const oneYearLater = "2025-01-01T00:00:00.000Z";
        const result = calculateLiveBalance(1000, startDate, 10, 0, [{ date: exitDate, amount: 500 }], oneYearLater);

        expect(Math.round(result)).toBe(576);
    });

    it("correctly handles multiple exit dates and tax", () => {
        // Complex scenario verification
        const result = calculateLiveBalance(
            10000,
            startDate,
            5,
            25,
            [
                { date: "2024-07-01", amount: 2000 },
                { date: "2025-01-01", amount: 1000 }
            ],
            "2025-07-01"
        );
        expect(result).toBeGreaterThan(7000);
        expect(result).toBeLessThan(8000);
    });
});
