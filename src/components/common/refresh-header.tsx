"use client";

import { useTranslation } from '@/hooks/use-translation';
import { RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import type { RefreshHeaderProps } from './types';

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
    children,
    titleKey,
    subtitleKey,
    namespace = 'common'
}: RefreshHeaderProps) {
    const { t } = useTranslation(namespace);

    const formatLastUpdated = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    };

    const isLoading = isRefreshing || isFetching;
    const displayTitle = titleKey ? t(titleKey) : title;
    const displaySubtitle = subtitleKey ? t(subtitleKey) : subtitle;

    return (
        <div className={`flex items-center justify-between ${className}`}>
            <div className="space-y-1">
                <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{displayTitle}</h3>
                    {isLoading && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-muted-foreground border-t-transparent mr-2" />
                            {isRefreshing ? t('labels.loading') : t('labels.loading')}
                        </div>
                    )}
                </div>
                {displaySubtitle && (
                    <p className="text-sm text-muted-foreground">{displaySubtitle}</p>
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
                    {isRefreshing ? t('labels.loading') : t('buttons.refresh')}
                </Button>
            </div>
        </div>
    );
} 