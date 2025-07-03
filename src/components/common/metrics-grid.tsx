"use client";

import MetricCard from './metric-card';
import type { MetricsGridProps } from './types';

export function MetricsGrid({
    metrics,
    columns = 4,
    variant = 'default',
    className = ""
}: MetricsGridProps) {
    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-2 lg:grid-cols-3',
        4: 'md:grid-cols-2 lg:grid-cols-4'
    };

    return (
        <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
            {metrics.map((metric) => (
                <MetricCard
                    key={metric.id}
                    title={metric.title}
                    value={metric.value}
                    description={metric.description}
                    icon={metric.icon}
                    iconColor={metric.iconColor}
                    onClick={metric.onClick}
                    variant={variant}
                    badge={metric.badge}
                    trend={metric.trend}
                />
            ))}
        </div>
    );
}

export default MetricsGrid; 