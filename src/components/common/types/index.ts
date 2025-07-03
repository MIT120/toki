import { LucideIcon } from 'lucide-react';

export interface MetricData {
    id: string;
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    iconColor?: string;
    onClick?: () => void;
    badge?: React.ReactNode;
    trend?: {
        value: number;
        isPositive?: boolean;
        label?: string;
    };
}

export interface Recommendation {
    message: string;
    urgencyLevel?: 'low' | 'medium' | 'high';
    type?: string;
    potentialSavings?: number;
}

export interface QueryStateWrapperProps<T = unknown> {
    data?: T;
    isLoading: boolean;
    isError: boolean;
    error?: Error | null;
    isEmpty?: boolean;
    onRefetch?: () => void;
    isRefetching?: boolean;
    isFetching?: boolean;
    children: React.ReactNode;
    loadingComponent?: React.ReactNode;
    errorTitle?: string;
    noDataTitle?: string;
    noDataMessage?: string;
    className?: string;
}

export interface LoadingSkeletonProps {
    variant?: 'default' | 'table' | 'chart' | 'metrics' | 'dashboard';
    className?: string;
    rows?: number;
    showHeader?: boolean;
}

export interface MetricCardProps {
    title?: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    iconColor?: string;
    onClick?: () => void;
    className?: string;
    variant?: 'default' | 'compact';
    badge?: React.ReactNode;
    trend?: {
        value: number;
        isPositive?: boolean;
        label?: string;
    };
    titleKey?: string;
    descriptionKey?: string;
    namespace?: string;
}

export interface MetricsGridProps {
    metrics: MetricData[];
    columns?: 2 | 3 | 4;
    variant?: 'default' | 'compact';
    className?: string;
}

export interface RecommendationsListProps {
    recommendations?: Recommendation[] | string[];
    title?: string;
    description?: string;
    emptyMessage?: string;
    onRecommendationClick?: (recommendation: Recommendation | string, index: number) => void;
    className?: string;
    variant?: 'default' | 'compact';
}

export interface RefreshHeaderProps {
    title?: string;
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
    titleKey?: string;
    subtitleKey?: string;
    namespace?: string;
}

import { BadgeProps } from '../../ui/badge';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
    status: 'high' | 'medium' | 'low' | 'good' | 'warning' | 'error' | 'success' | 'info' | 'active' | 'inactive';
    label?: string;
    customVariant?: BadgeProps['variant'];
    namespace?: string;
} 