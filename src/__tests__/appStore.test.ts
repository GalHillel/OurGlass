import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/appStore';

describe('useAppStore', () => {
    beforeEach(() => {
        // Zustand doesn't reset between tests naturally unless we force it or just reconstruct state
        useAppStore.setState({
            monthOffset: 0,
            isAddTransactionOpen: false,
            activeTab: 'home',
            deepFreezeEnabled: true,
            coupleId: null,
            appIdentity: null,
        });
    });

    it('should initialize with default values', () => {
        const state = useAppStore.getState();
        expect(state.monthOffset).toBe(0);
        expect(state.isAddTransactionOpen).toBe(false);
        expect(state.activeTab).toBe('home');
        expect(state.deepFreezeEnabled).toBe(true);
        expect(state.coupleId).toBeNull();
        expect(state.appIdentity).toBeNull();
    });

    it('should set month offset', () => {
        useAppStore.getState().setMonthOffset(-1);
        expect(useAppStore.getState().monthOffset).toBe(-1);
    });

    it('should toggle transaction drawer', () => {
        useAppStore.getState().openAddTransaction();
        expect(useAppStore.getState().isAddTransactionOpen).toBe(true);

        useAppStore.getState().closeAddTransaction();
        expect(useAppStore.getState().isAddTransactionOpen).toBe(false);
    });

    it('should set active tab', () => {
        useAppStore.getState().setActiveTab('investments');
        expect(useAppStore.getState().activeTab).toBe('investments');
    });

    it('should toggle deep freeze', () => {
        useAppStore.getState().toggleDeepFreeze();
        expect(useAppStore.getState().deepFreezeEnabled).toBe(false);

        useAppStore.getState().toggleDeepFreeze();
        expect(useAppStore.getState().deepFreezeEnabled).toBe(true);
    });

    it('should set couple id', () => {
        useAppStore.getState().setCoupleId('test-couple-123');
        expect(useAppStore.getState().coupleId).toBe('test-couple-123');
    });

    it('should set app identity', () => {
        useAppStore.getState().setAppIdentity('him');
        expect(useAppStore.getState().appIdentity).toBe('him');

        useAppStore.getState().setAppIdentity('her');
        expect(useAppStore.getState().appIdentity).toBe('her');

        useAppStore.getState().setAppIdentity(null);
        expect(useAppStore.getState().appIdentity).toBeNull();
    });
});
