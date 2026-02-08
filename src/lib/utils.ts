import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHebrewError(error: any): string {
  if (!error) return "שגיאה לא ידועה";
  const msg = error.message?.toLowerCase() || "";

  if (msg.includes("unique constraint") || error.code === '23505') return "הפריט כבר קיים במערכת";
  if (msg.includes("violates check constraint")) return "נתונים לא תקינים";
  if (msg.includes("null value")) return "חסרים נתונים בגוף הבקשה";
  if (msg.includes("foreign key")) return "לא ניתן למחוק פריט זה מכיוון שהוא מקושר לנתונים אחרים";
  if (msg.includes("network") || msg.includes("fetch")) return "בעיית תקשורת, נסו שוב מאוחר יותר";

  return "אירעה שגיאה בעיבוד הבקשה";
}

// --- Smart Financial Utils ---

/**
 * Calculates the "Burn Rate" and predicts when the budget will run out.
 * @param currentBalance Current remaining balance (e.g. 5000)
 * @param daysRemaining Days left in the month/cycle (e.g. 10)
 * @param averageDailySpend Average daily spending so far (e.g. 300)
 * @returns Object with status and projected date
 */
export function calculateBurnRate(currentBalance: number, daysRemaining: number, averageDailySpend: number): { status: 'safe' | 'warning' | 'critical'; daysUntilZero: number; projectedDate: Date | null } {
  if (currentBalance <= 0) return { status: 'critical', daysUntilZero: 0, projectedDate: new Date() };
  if (averageDailySpend <= 0) return { status: 'safe', daysUntilZero: 999, projectedDate: null };

  const daysUntilZero = currentBalance / averageDailySpend;
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + Math.ceil(daysUntilZero));

  let status: 'safe' | 'warning' | 'critical' = 'safe';

  // If we run out BEFORE the month ends (with 2 days buffer for safety)
  if (daysUntilZero < daysRemaining - 2) {
    status = 'critical';
  } else if (daysUntilZero < daysRemaining + 2) {
    // Tight margin
    status = 'warning';
  }

  return { status, daysUntilZero, projectedDate };
}

/**
 * Detects spending anomalies based on category averages.
 * Mock implementation that can be connected to real DB stats later.
 */
export function detectSpendingAnomaly(amount: number, categoryAverage: number) {
  if (!categoryAverage || categoryAverage === 0) return null;

  const deviation = (amount - categoryAverage) / categoryAverage;

  if (deviation > 0.5) { // 50% more than average
    return {
      isAnomaly: true,
      deviationPercent: Math.round(deviation * 100),
      message: `הוצאה חריגה: ${Math.round(deviation * 100)}% מעל הממוצע לקטגוריה זו`
    };
  }

  return null;
}

/**
 * Calculates future net worth based on compound interest.
 * @param currentWealth Starting amount
 * @param monthlySavings Monthly contribution
 * @param annualReturnRate Annual return rate (e.g. 0.07 for 7%)
 * @param years Number of years to project
 */
export function calculateFutureWealth(currentWealth: number, monthlySavings: number, annualReturnRate: number, years: number) {
  const months = years * 12;
  const monthlyRate = annualReturnRate / 12;

  // Future Value of Lump Sum: PV * (1 + r)^n
  const fvLumpSum = currentWealth * Math.pow(1 + monthlyRate, months);

  // Future Value of Series (Annuity): PMT * (((1 + r)^n - 1) / r)
  const fvSeries = monthlySavings * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

  return Math.round(fvLumpSum + fvSeries);
}
