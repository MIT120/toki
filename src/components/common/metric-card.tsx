"use client";

import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent } from '../ui/card';
import type { MetricCardProps } from './types';

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
    namespace = 'common'
}: MetricCardProps) {
    const { t } = useTranslation(namespace);

    const displayTitle = titleKey ? t(titleKey) : title;
    const displayDescription = descriptionKey ? t(descriptionKey) : description;

    const cardClasses = onClick
        ? `cursor-pointer hover:shadow-md transition-shadow ${className}`
        : className;

    const contentPadding = variant === 'compact' ? 'p-4' : 'p-4 lg:p-6';

    return (
        <Card className={cardClasses} onClick={onClick}>
            <CardContent className={`flex items-center justify-between ${contentPadding}`}>
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">{displayTitle}</p>
                    <div className="flex items-end gap-2 mt-1">
                        <p className={`font-bold ${variant === 'compact' ? 'text-xl' : 'text-xl lg:text-2xl'}`}>
                            {value}
                        </p>
                        {trend && (
                            <span className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {trend.isPositive ? '+' : ''}{trend.value}%
                            </span>
                        )}
                    </div>
                    {displayDescription && (
                        <p className="text-xs text-muted-foreground mt-1">{displayDescription}</p>
                    )}
                    {trend?.label && (
                        <p className="text-xs text-muted-foreground">{trend.label}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <Icon className={`${variant === 'compact' ? 'h-6 w-6' : 'h-6 w-6 lg:h-8 lg:w-8'} ${iconColor}`} />
                    {badge}
                </div>
            </CardContent>
        </Card>
    );
}

export default MetricCard; 