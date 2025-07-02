"use client";

import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';

interface RefreshHeaderProps {
    title: string;
    subtitle?: string;
    isRefreshing?: boolean;
    isFetching?: boolean;
    onRefresh: () => void;
    showLastUpdated?: boolean;
    lastUpdated?: Date;
    refreshButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    refreshButtonSize?: "default" | "sm" | "lg" | "icon";
    className?: string;
    children?: React.ReactNode;
}

export default function RefreshHeader({
    title,
    subtitle,
    isRefreshing = false,
    isFetching = false,
    onRefresh,
    showLastUpdated = false,
    lastUpdated,
    refreshButtonVariant = "outline",
    refreshButtonSize = "sm",
    className = "",
    children
}: RefreshHeaderProps) {
    const formatLastUpdated = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    };

    const isLoading = isRefreshing || isFetching;

    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {isLoading && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-muted-foreground border-t-transparent mr-2" />
                            {isRefreshing ? 'Refreshing...' : 'Loading...'}
                        </div>
                    )}
                </div>
                {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
                {showLastUpdated && lastUpdated && (
                    <p className="text-xs text-muted-foreground">
                        Last updated: {formatLastUpdated(lastUpdated)}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {children}
                <Button
                    onClick={onRefresh}
                    disabled={isLoading}
                    variant={refreshButtonVariant}
                    size={refreshButtonSize}
                    className="flex items-center gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>
        </div>
    );
} 