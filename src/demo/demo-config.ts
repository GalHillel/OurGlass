export const DEMO_MODE = true;

// A fixed date in the past to ensure demo data doesn't "expire" or move out of the viewing window
export const DEMO_DATE = '2026-03-03T12:00:00Z';

/**
 * Returns the current date in demo mode, or the real date in production.
 */
export function getNow(): Date {
    return DEMO_MODE ? new Date(DEMO_DATE) : new Date();
}

/**
 * Helper to get a stable ISO string for today in demo mode
 */
export function getTodayISO(): string {
    return getNow().toISOString().split('T')[0];
}
