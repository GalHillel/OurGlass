/**
 * Smart Haptic Feedback System
 * Maps different financial actions to distinct vibration patterns
 * to create psychological associations with money.
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'double';

const PATTERNS: Record<HapticPattern, number | number[]> = {
    light: 10,           // Gentle tap — browsing, navigation
    medium: 25,          // Standard — button presses
    heavy: [50, 30, 50], // Strong double — big expenses, warnings
    success: [15, 50, 15], // Quick celebration — savings, income
    warning: [30, 20, 30, 20, 30], // Triple pulse — budget alerts
    error: [80],         // Single strong — errors, deletes
    double: [15, 30, 15], // Two taps — confirmations
};

function vibrate(pattern: number | number[]): boolean {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        return navigator.vibrate(pattern);
    }
    return false;
}

/** Check if haptics are supported/enabled */
export const supportsHaptics = () => typeof navigator !== 'undefined' && !!navigator.vibrate;

/** Light tap — navigation, browsing */
export const triggerHaptic = () => vibrate(PATTERNS.light);

/** Income received, savings goal progress */
export const hapticSuccess = () => vibrate(PATTERNS.success);

/** Budget warning, approaching limit */
export const hapticWarning = () => vibrate(PATTERNS.warning);

/** Large expense (>1000{CURRENCY_SYMBOL}), delete action */
export const hapticHeavy = () => vibrate(PATTERNS.heavy);

/** Error, failed action */
export const hapticError = () => vibrate(PATTERNS.error);

/** Confirmation, approval */
export const hapticConfirm = () => vibrate(PATTERNS.double);

/**
 * Smart haptic based on expense amount.
 * Gentle for small, medium for moderate, heavy for large (>1000{CURRENCY_SYMBOL}).
 */
export const hapticForAmount = (amount: number) => {
    if (amount >= 1000) {
        return vibrate(PATTERNS.heavy);
    } else if (amount >= 300) {
        return vibrate(PATTERNS.medium);
    } else {
        return vibrate(PATTERNS.light);
    }
};