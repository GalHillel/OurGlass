import { describe, expect, it } from 'vitest';
import { sanitizeWealthSnapshots } from '@/hooks/useWealthData';
import type { WealthSnapshot } from '@/types';

const base = (date: string, netWorth: number): WealthSnapshot => ({
  id: date,
  couple_id: 'c1',
  snapshot_date: date,
  net_worth: netWorth,
  cash_value: 0,
  investments_value: 0,
  liabilities_value: 0,
  created_at: new Date().toISOString(),
});

describe('sanitizeWealthSnapshots', () => {
  it('removes isolated ghost spike and keeps surrounding baseline', () => {
    const sanitized = sanitizeWealthSnapshots([
      base('2026-03-01', 100000),
      base('2026-03-02', 420000),
      base('2026-03-03', 101000),
    ]);

    expect(sanitized.map(s => s.snapshot_date)).toEqual(['2026-03-01', '2026-03-03']);
  });

  it('keeps legitimate gradual growth', () => {
    const sanitized = sanitizeWealthSnapshots([
      base('2026-03-01', 100000),
      base('2026-03-02', 106000),
      base('2026-03-03', 112000),
      base('2026-03-04', 118000),
    ]);

    expect(sanitized).toHaveLength(4);
  });
});
