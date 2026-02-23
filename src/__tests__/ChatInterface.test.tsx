import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from '@/components/ChatInterface';

// Mock framer-motion since ChatInterface uses motion.div, motion.button, motion.span
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
        span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useChat from ai-sdk
const mockSendMessage = vi.fn();
vi.mock('@ai-sdk/react', () => ({
    useChat: () => ({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
        setMessages: vi.fn(),
        sendMessage: mockSendMessage,
        status: 'idle'
    })
}));

describe('ChatInterface', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // jsdom does not implement scrollTo on regular elements
        Element.prototype.scrollTo = vi.fn();
        // Mock localStorage for ChatInterface's initial load
        const store: Record<string, string> = {};
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value; });
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => { delete store[key]; });
    });

    it('renders initial loaded messages', () => {
        render(<ChatInterface context={{}} onClose={vi.fn()} />);
        // should render the mocked message
        expect(screen.getByText('Hello')).toBeInTheDocument();
        // Header shows the AI name
        expect(screen.getByText('רועי')).toBeInTheDocument();
    });

    it('sends message and passes context when submitting form', () => {
        render(<ChatInterface context={{ budget: 5000 }} onClose={vi.fn()} />);

        // The actual placeholder in the source is "שאל את רועי..."
        const input = screen.getByPlaceholderText('שאל את רועי...');
        fireEvent.change(input, { target: { value: 'How is my budget?' } });

        // The send button is a motion.button (mocked as <button>), find by its SVG child or role
        const buttons = screen.getAllByRole('button');
        // The send button is the last button in the input area
        const sendButton = buttons[buttons.length - 1];
        fireEvent.click(sendButton);

        expect(mockSendMessage).toHaveBeenCalledWith(
            { text: 'How is my budget?' },
            { body: { context: { budget: 5000 } } }
        );
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(<ChatInterface context={{}} onClose={onClose} />);

        const button = screen.getByRole('button', { name: 'Close' });
        fireEvent.click(button);

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
