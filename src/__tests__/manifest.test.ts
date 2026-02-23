import { describe, it, expect } from 'vitest';
import manifest from '@/app/manifest';

describe('Manifest', () => {
    it('returns the correct manifest configuration', () => {
        const result = manifest();
        expect(result.name).toBe('OurGlass Finance Tracker');
        expect(result.short_name).toBe('OurGlass');
        expect(result.start_url).toBe('/');
        expect(result.display).toBe('standalone');
        expect(result.background_color).toBe('#0f172a');
        expect(result.theme_color).toBe('#0f172a');
        expect(result.icons).toHaveLength(3);
    });
});
