"use client";

import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent } from '../ui/card';
import type { MetricCardProps, MetricData } from './types';

interface MetricCardExtendedProps extends Omit<MetricCardProps, 'title' | 'description'> {
    metricData?: MetricData;
}

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    iconColor = "text-blue-500",
    onClick,
    className = "",
    variant = 'default',
    badge,
    trend,
    titleKey,
    descriptionKey,
    namespace = 'common',
    metricData
}: MetricCardProps & MetricCardExtendedProps) {
    const { t } = useTranslation(namespace);

    // Use metricData if provided, otherwise use individual props
    const finalTitleKey = metricData?.titleKey || titleKey;
    const finalDescriptionKey = metricData?.descriptionKey || descriptionKey;
    const finalNamespace = metricData?.namespace || namespace;
    const finalTitle = metricData?.title || title;
    const finalDescription = metricData?.description || description;

    const { t: tFinal } = useTranslation(finalNamespace);

    const displayTitle = finalTitleKey ? tFinal(finalTitleKey) : finalTitle;
    const displayDescription = finalDescriptionKey ? tFinal(finalDescriptionKey) : finalDescription;

    const cardClasses = onClick
        ? `cursor-pointer hover:shadow-md transition-shadow ${className}`
        : className;

    const contentPadding = variant === 'compact' ? 'p-4' : 'p-4 lg:p-6';

    return (
        <Card className={cardClasses} onClick={onClick}>
            <CardContent className={contentPadding}>
                <div className="flex items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium leading-none">
                                {displayTitle}
                            </p>
                            {badge && (
                                <div className="ml-2">
                                    {badge}
                                </div>
                            )}
                        </div>
                        {displayDescription && (
                            <p className="text-xs text-muted-foreground">
                                {displayDescription}
                            </p>
                        )}
                    </div>
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <div className="space-y-1">
                    <div className="flex items-baseline space-x-2">
                        <div className="text-2xl font-bold">
                            {value}
                        </div>
                        {trend && (
                            <div className={`flex items-center text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                <span>
                                    {trend.isPositive ? '+' : ''}{trend.value}%
                                </span>
                                {trend.label && (
                                    <span className="ml-1 text-muted-foreground">
                                        {trend.label}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default MetricCard; 