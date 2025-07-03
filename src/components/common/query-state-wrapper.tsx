"use client";

import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import type { QueryStateWrapperProps } from './types';

export function QueryStateWrapper({
    isLoading,
    isError,
    error,
    data,
    isEmpty = false,
    onRefetch,
    isRefetching = false,
    isFetching = false,
    children,
    loadingComponent,
    errorTitle = "Error",
    noDataTitle = "No Data Available",
    noDataMessage = "No data available at the moment.",
    className = ""
}: QueryStateWrapperProps) {
    if (isLoading) {
        return loadingComponent || <DefaultLoadingSkeleton />;
    }

    if (isError) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        return (
            <Alert variant="destructive" className={className}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{errorTitle}</AlertTitle>
                <AlertDescription>
                    {errorMessage}
                    {onRefetch && (
                        <div className="mt-2">
                            <Button
                                onClick={onRefetch}
                                disabled={isRefetching}
                                variant="outline"
                                size="sm"
                            >
                                {isRefetching ? 'Retrying...' : 'Try Again'}
                            </Button>
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    if (!data || isEmpty) {
        return (
            <Alert className={className}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{noDataTitle}</AlertTitle>
                <AlertDescription>
                    {noDataMessage}
                    {onRefetch && (
                        <div className="mt-2">
                            <Button
                                onClick={onRefetch}
                                disabled={isFetching}
                                variant="outline"
                                size="sm"
                            >
                                {isFetching ? 'Refreshing...' : 'Refresh'}
                            </Button>
                        </div>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    return <>{children}</>;
}

function DefaultLoadingSkeleton() {
    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-8 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default QueryStateWrapper; 