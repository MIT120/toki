"use client";

import { Card, CardContent, CardHeader } from '../ui/card';
import type { LoadingSkeletonProps } from './types';

export function LoadingSkeleton({
    variant = 'default',
    className = "",
    rows = 3,
    showHeader = true
}: LoadingSkeletonProps) {
    switch (variant) {
        case 'metrics':
            return (
                <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardContent className="flex items-center justify-between p-4 lg:p-6">
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                                </div>
                                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            );

        case 'table':
            return (
                <Card className={className}>
                    {showHeader && (
                        <CardHeader>
                            <div className="h-6 bg-muted rounded w-1/3 animate-pulse mb-2" />
                            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                        </CardHeader>
                    )}
                    <CardContent>
                        <div className="space-y-4">
                            {/* Table header */}
                            <div className="grid grid-cols-4 gap-4 pb-2 border-b">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="h-4 bg-muted rounded animate-pulse" />
                                ))}
                            </div>
                            {/* Table rows */}
                            {Array.from({ length: rows }).map((_, i) => (
                                <div key={i} className="grid grid-cols-4 gap-4 py-2">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <div key={j} className="h-4 bg-muted rounded animate-pulse" />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            );

        case 'chart':
            return (
                <Card className={className}>
                    {showHeader && (
                        <CardHeader>
                            <div className="h-6 bg-muted rounded w-1/3 animate-pulse mb-2" />
                            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                        </CardHeader>
                    )}
                    <CardContent>
                        <div className="h-[400px] bg-muted rounded animate-pulse" />
                    </CardContent>
                </Card>
            );

        case 'dashboard':
            return (
                <div className={`space-y-6 ${className}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                            <div className="space-y-1">
                                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Metrics */}
                    <LoadingSkeleton variant="metrics" />

                    {/* Two column layout */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
                                    <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, j) => (
                                        <div key={j} className="flex items-center justify-between space-x-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                                            </div>
                                            <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            );

        default:
            return (
                <Card className={className}>
                    {showHeader && (
                        <CardHeader>
                            <div className="h-6 bg-muted rounded w-1/3 animate-pulse mb-2" />
                            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                        </CardHeader>
                    )}
                    <CardContent>
                        <div className="space-y-4">
                            {Array.from({ length: rows }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 bg-muted rounded animate-pulse" />
                                    {i === rows - 1 && (
                                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            );
    }
}

export default LoadingSkeleton; 