import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeepFreezeApproval, DeepFreezeToggle } from '@/components/DeepFreezeApproval';
import {  CURRENCY_SYMBOL} from "@/lib/constants";

vi.mock('sonner', () => ({
    toast: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() })
}));

vi.mock('@/utils/haptics', () => ({
    hapticSuccess: vi.fn(),
    hapticWarning: vi.fn(),
    hapticHeavy: vi.fn(),
}));

describe('DeepFreezeApproval', () => {
    it('renders approval modal with details', () => {
        const request = {
            id: 'req-1',
            goalName: 'Vacation',
            amount: 5000,
            requestedBy: 'Gal',
            status: 'pending' as const
        };

        render(
            <DeepFreezeApproval
                isOpen={true}
                onClose={vi.fn()}
                request={request}
                onApprove={vi.fn()}
                onReject={vi.fn()}
            />
        );

        expect(screen.getByText('בקשת שחרור מהקפאה')).toBeInTheDocument();
        expect(screen.getByText('Vacation')).toBeInTheDocument();
        expect(screen.getByText('Gal')).toBeInTheDocument();
        expect(screen.getByText(`${CURRENCY_SYMBOL}5,000`)).toBeInTheDocument();
    });

    it('calls onApprove on approval', async () => {
        const request = { id: 'req-1', goalName: 'Vacation', amount: 5000, requestedBy: 'Gal', status: 'pending' as const };
        const onApprove = vi.fn();

        render(
            <DeepFreezeApproval isOpen={true} onClose={vi.fn()} request={request} onApprove={onApprove} onReject={vi.fn()} />
        );

        fireEvent.click(screen.getByText('אישור'));
        expect(onApprove).toHaveBeenCalledWith('req-1');
    });

    it('calls onReject on rejection', async () => {
        const request = { id: 'req-1', goalName: 'Vacation', amount: 5000, requestedBy: 'Gal', status: 'pending' as const };
        const onReject = vi.fn();

        render(
            <DeepFreezeApproval isOpen={true} onClose={vi.fn()} request={request} onApprove={vi.fn()} onReject={onReject} />
        );

        fireEvent.click(screen.getByText('דחייה'));
        expect(onReject).toHaveBeenCalledWith('req-1');
    });
});

describe('DeepFreezeToggle', () => {
    it('renders frozen state correctly', () => {
        const onToggle = vi.fn();
        render(<DeepFreezeToggle isFrozen={true} onToggle={onToggle} />);

        const btn = screen.getByRole('button');
        expect(btn).toHaveClass('bg-blue-500/10');
        expect(screen.getByText('מוקפא')).toBeInTheDocument();

        fireEvent.click(btn);
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('renders unfrozen state correctly', () => {
        render(<DeepFreezeToggle isFrozen={false} onToggle={vi.fn()} />);

        expect(screen.getByText('הקפאה')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveClass('bg-white/5');
    });
});