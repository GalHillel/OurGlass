import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as haptics from '../utils/haptics';

// Original vibrate mock store
let vibrateMock: any;

describe('Haptics System', () => {
    beforeEach(() => {
        // Setup mock for navigator.vibrate
        vibrateMock = vi.fn();
        vi.stubGlobal('navigator', { vibrate: vibrateMock });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('should handle missing navigator gracefully', () => {
        vi.stubGlobal('navigator', undefined);

        // Shouldn't throw error
        expect(() => haptics.triggerHaptic()).not.toThrow();
    });

    it('should trigger light haptic correctly', () => {
        haptics.triggerHaptic();
        expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('should trigger success haptic correctly', () => {
        haptics.hapticSuccess();
        expect(vibrateMock).toHaveBeenCalledWith([15, 50, 15]);
    });

    it('should trigger warning haptic correctly', () => {
        haptics.hapticWarning();
        expect(vibrateMock).toHaveBeenCalledWith([30, 20, 30, 20, 30]);
    });

    it('should trigger heavy haptic correctly', () => {
        haptics.hapticHeavy();
        expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50]);
    });

    it('should trigger error haptic correctly', () => {
        haptics.hapticError();
        expect(vibrateMock).toHaveBeenCalledWith([80]);
    });

    it('should trigger confirm/double haptic correctly', () => {
        haptics.hapticConfirm();
        expect(vibrateMock).toHaveBeenCalledWith([15, 30, 15]);
    });

    describe('hapticForAmount()', () => {
        it('should trigger heavy pattern for amount >= 1000', () => {
            haptics.hapticForAmount(1000);
            expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50]);

            haptics.hapticForAmount(5000);
            expect(vibrateMock).toHaveBeenCalledWith([50, 30, 50]);
        });

        it('should trigger medium pattern for 300 <= amount < 1000', () => {
            haptics.hapticForAmount(300);
            expect(vibrateMock).toHaveBeenCalledWith(25);

            haptics.hapticForAmount(999);
            expect(vibrateMock).toHaveBeenCalledWith(25);
        });

        it('should trigger light pattern for amount < 300', () => {
            haptics.hapticForAmount(299);
            expect(vibrateMock).toHaveBeenCalledWith(10);

            haptics.hapticForAmount(0);
            expect(vibrateMock).toHaveBeenCalledWith(10);

            // Testing negative amounts (edge case)
            haptics.hapticForAmount(-50);
            expect(vibrateMock).toHaveBeenCalledWith(10);
        });
    });
});
