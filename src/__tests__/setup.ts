import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfills for Radix UI, Framer Motion, and Vaul (Drawer)
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

if (typeof window !== 'undefined') {
    class MockPointerEvent extends Event {
        button: number;
        ctrlKey: boolean;
        pointerType: string;

        constructor(type: string, props: PointerEventInit) {
            super(type, props);
            this.button = props.button || 0;
            this.ctrlKey = props.ctrlKey || false;
            this.pointerType = props.pointerType || 'mouse';
        }
    }
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    window.HTMLElement.prototype.releasePointerCapture = vi.fn();
    window.HTMLElement.prototype.hasPointerCapture = vi.fn();
}
