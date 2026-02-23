import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

describe('Mass Validation - UI Components', () => {
    // 100 permutations of Badge
    const badgeCases = Array.from({ length: 100 }, (_, i) => {
        const variants = ['default', 'secondary', 'destructive', 'outline'] as const;
        return [
            i,
            `Badge Text ${i}`,
            variants[i % variants.length]
        ];
    });

    describe('Badge extensive permutations', () => {
        it.each(badgeCases)('renders correctly for ID %i with variant %s', (id, text, variant) => {
            render(<Badge variant={variant as "default" | "secondary" | "destructive" | "outline"}>{text as string}</Badge>);
            const element = screen.getByText(text as string);
            expect(element).toBeInTheDocument();
        });
    });

    // 100 permutations of Button
    const buttonCases = Array.from({ length: 100 }, (_, i) => {
        const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
        const sizes = ['default', 'sm', 'lg', 'icon'] as const;
        return [
            i,
            `Button Click Me ${i}`,
            variants[i % variants.length],
            sizes[i % sizes.length],
            i % 5 === 0 // disabled
        ];
    });

    describe('Button extensive permutations', () => {
        it.each(buttonCases)('renders correctly for ID %i with variant %s, size %s, disabled: %s', (id, text, variant, size, disabled) => {
            render(<Button variant={variant as "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"} size={size as "default" | "sm" | "lg" | "icon"} disabled={disabled as boolean}>{text as string}</Button>);
            const element = screen.getByText(text as string);
            expect(element).toBeInTheDocument();
            expect(element.tagName).toBe('BUTTON');
        });
    });
});
