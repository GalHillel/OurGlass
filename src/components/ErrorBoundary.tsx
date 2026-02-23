"use client";

import { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // TODO: Send to telemetry service (Sentry/PostHog)
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <h2 className="text-lg font-semibold text-white mb-2">משהו השתבש</h2>
                    <p className="text-white/60 text-sm mb-4">
                        {this.state.error?.message || "שגיאה לא צפויה"}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm transition-colors"
                    >
                        נסו שוב
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
