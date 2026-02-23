import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import NotFound from '@/app/not-found';

describe('Not Found Page', () => {
    it('renders 404 message and home link', () => {
        render(<NotFound />);

        expect(screen.getByText('404')).toBeInTheDocument();
        expect(screen.getByText('העמוד לא נמצא')).toBeInTheDocument();
        expect(screen.getByText('חזרה הביתה')).toBeInTheDocument();
        // Since Link is used, checking the href is slightly complex without router context
        // but checking the button text is sufficient for UI render test here.
    });
});
