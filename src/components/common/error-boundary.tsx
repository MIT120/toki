"use client";

import { AlertTriangle, RefreshCw } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logError, type ErrorContext } from '../../utils/error-logger';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    context?: ErrorContext;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
    eventId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const { context, onError } = this.props;

        // Log error to Sentry with context
        logError(error, {
            level: 'error',
            context: {
                component: 'ErrorBoundary',
                action: 'componentDidCatch',
                ...context,
                additionalData: {
                    componentStack: errorInfo.componentStack || 'Unknown component stack',
                    errorBoundary: true,
                },
            },
            tags: {
                error_boundary: 'true',
                component_name: context?.component || 'unknown',
            },
        });

        this.setState({
            error,
            errorInfo,
        });

        // Call custom error handler if provided
        if (onError) {
            onError(error, errorInfo);
        }
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    private handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            const { fallback } = this.props;

            if (fallback) {
                return fallback;
            }

            return (
                <div className="min-h-[400px] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl">Something went wrong</CardTitle>
                            <CardDescription>
                                We encountered an unexpected error. This issue has been reported and we're working to fix it.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Button
                                    onClick={this.handleRetry}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Again
                                </Button>
                                <Button
                                    onClick={this.handleReload}
                                    className="flex-1"
                                >
                                    Reload Page
                                </Button>
                            </div>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                        Error Details (Development Only)
                                    </summary>
                                    <div className="mt-2 rounded-md bg-muted p-3 text-xs">
                                        <div className="font-semibold text-red-600">
                                            {this.state.error.name}: {this.state.error.message}
                                        </div>
                                        <pre className="mt-2 whitespace-pre-wrap break-all">
                                            {this.state.error.stack}
                                        </pre>
                                        {this.state.errorInfo && (
                                            <div className="mt-2">
                                                <div className="font-semibold">Component Stack:</div>
                                                <pre className="whitespace-pre-wrap break-all">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            )}
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Convenience wrapper for common use cases
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
} 