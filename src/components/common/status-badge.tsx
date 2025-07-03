"use client";

import { useTranslation } from '@/hooks/use-translation';
import { Badge } from '../ui/badge';
import type { StatusBadgeProps } from './types';

const statusConfig = {
    high: { variant: 'destructive' as const, translationKey: 'status.high' },
    medium: { variant: 'outline' as const, translationKey: 'status.medium' },
    low: { variant: 'secondary' as const, translationKey: 'status.low' },
    good: { variant: 'default' as const, translationKey: 'status.good' },
    warning: { variant: 'outline' as const, translationKey: 'status.warning' },
    error: { variant: 'destructive' as const, translationKey: 'status.error' },
    success: { variant: 'default' as const, translationKey: 'status.success' },
    info: { variant: 'secondary' as const, translationKey: 'status.info' },
    active: { variant: 'default' as const, translationKey: 'status.active' },
    inactive: { variant: 'secondary' as const, translationKey: 'status.inactive' },
};

export function StatusBadge({
    status,
    label,
    customVariant,
    className = "",
    namespace = 'common',
    ...props
}: StatusBadgeProps) {
    const { t } = useTranslation(namespace);

    const config = statusConfig[status];
    const variant = customVariant || config.variant;
    const displayLabel = label || t(config.translationKey);

    return (
        <Badge variant={variant} className={className} {...props}>
            {displayLabel}
        </Badge>
    );
}

// Usage helper functions for common patterns
export function getUsageStatusBadge(usage: number, maxUsage: number, threshold = { high: 0.8, medium: 0.6 }) {
    const percentage = (usage / maxUsage);
    if (percentage >= threshold.high) return 'high';
    if (percentage >= threshold.medium) return 'medium';
    return 'low';
}

export function getPriceStatusBadge(price: number, avgPrice: number, threshold = { high: 1.2, medium: 1.1 }) {
    if (price > avgPrice * threshold.high) return 'high';
    if (price > avgPrice * threshold.medium) return 'medium';
    return 'low';
}

export function getEfficiencyStatusBadge(score: number, threshold = { good: 80, medium: 60 }) {
    if (score >= threshold.good) return 'good';
    if (score >= threshold.medium) return 'medium';
    return 'warning';
}

export default StatusBadge; 