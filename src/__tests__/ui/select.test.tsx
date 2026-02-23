import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectLabel
} from '@/components/ui/select';

describe('Select', () => {
    it.skip('opens and selects a value correctly', async () => {
        const onValueChange = vi.fn();

        render(
            <Select onValueChange={onValueChange}>
                <SelectTrigger aria-label="Food">
                    <SelectValue placeholder="Select a food" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Fruits</SelectLabel>
                        <SelectItem value="apple">Apple</SelectItem>
                        <SelectItem value="banana">Banana</SelectItem>
                        <SelectItem value="blueberry" disabled>Blueberry</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        );

        // Click to open
        fireEvent.click(screen.getByRole('combobox', { name: 'Food' }));

        // Wait for listbox
        await waitFor(() => {
            expect(screen.getByRole('listbox')).toBeInTheDocument();
        });

        // Click an option
        fireEvent.click(screen.getByRole('option', { name: 'Banana' }));

        expect(onValueChange).toHaveBeenCalledWith('banana');
    });
});
