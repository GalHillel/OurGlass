export function accrueCompoundAnnual({
  principal,
  annualRateDecimal,
  elapsedMs,
  daysPerYear = 365,
}: {
  principal: number;
  annualRateDecimal: number;
  elapsedMs: number;
  daysPerYear?: number;
}): number {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  if (!Number.isFinite(annualRateDecimal) || annualRateDecimal <= 0) return principal;
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return principal;

  const msPerYear = daysPerYear * 24 * 60 * 60 * 1000;
  const yearFraction = elapsedMs / msPerYear;
  return principal * Math.pow(1 + annualRateDecimal, yearFraction);
}

