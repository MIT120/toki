"use client";

import {
    Clock,
    DollarSign,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useInsightsQuery } from '../../hooks/use-insights-query';
import { useTranslation } from '../../hooks/use-translation';
import {
    roundCurrency,
    roundPrice,
    roundToDecimals,
    roundUsage
} from '../../utils/electricity-calculations';
import MetricsGrid from '../common/metrics-grid';
import QueryStateWrapper from '../common/query-state-wrapper';
import RecommendationsList from '../common/recommendations-list';
import RefreshHeader from '../common/refresh-header';
import StatusBadge from '../common/status-badge';
import type { MetricData } from '../common/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import type {
    RealTimeInsightsContentProps,
    RealTimeInsightsProps
} from './types';

export default function RealTimeInsightsComponent({
    meteringPointId,
    date,
    autoRefresh = true,
    refreshInterval = 60000
}: RealTimeInsightsProps) {
    const { t } = useTranslation('insights');
    const { t: tCommon } = useTranslation('common');

    const {
        data: insights,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        isRefetching
    } = useInsightsQuery(meteringPointId, date, {
        enabled: !!meteringPointId,
        enableAnalytics: true,
        staleTime: 1000 * 60 * 1, // 1 minute for real-time insights
        refetchInterval: autoRefresh ? refreshInterval : false,
    });

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    };

    // Prepare metrics data when data is available
    const metricsData: MetricData[] = insights ? [
        {
            id: 'current_usage',
            titleKey: 'metrics.currentUsage',
            value: `${roundUsage(insights.currentUsage || 0)} ${tCommon('units.kWh')}`,
            icon: Zap,
            iconColor: 'text-blue-500',
            namespace: 'insights'
        },
        {
            id: 'current_cost',
            titleKey: 'metrics.currentCost',
            value: `${roundCurrency(insights.currentCost || 0)} ${tCommon('units.bgn')}`,
            icon: DollarSign,
            iconColor: 'text-green-500',
            namespace: 'insights'
        },
        {
            id: 'current_price',
            titleKey: 'metrics.currentPrice',
            value: roundPrice(insights.currentPrice || 0),
            description: tCommon('units.bgnPerKwh'),
            icon: TrendingUp,
            iconColor: 'text-orange-500',
            namespace: 'insights'
        },
        {
            id: 'hour_progress',
            titleKey: 'metrics.hourProgress',
            value: `${roundToDecimals(insights.hourProgress || 0, 0)}${tCommon('units.percent')}`,
            icon: Clock,
            iconColor: 'text-purple-500',
            namespace: 'insights'
        }
    ] : [];

    return (
        <QueryStateWrapper
            isLoading={isLoading}
            isError={isError}
            error={error}
            data={insights}
            onRefetch={() => refetch()}
            isRefetching={isRefetching}
            isFetching={isFetching}
            errorTitle={t('errors.loadingTitle')}
            noDataTitle={t('errors.noDataTitle')}
            noDataMessage={t('errors.noDataMessage')}
        >
            <RealTimeInsightsContent
                insights={insights!}
                metricsData={metricsData}
                formatTime={formatTime}
                isRefetching={isRefetching}
                isFetching={isFetching}
                onRefetch={() => refetch()}
            />
        </QueryStateWrapper>
    );
}



function RealTimeInsightsContent({
    insights,
    metricsData,
    formatTime,
    isRefetching,
    isFetching,
    onRefetch
}: RealTimeInsightsContentProps) {
    const { t } = useTranslation('insights');
    const { t: tCommon } = useTranslation('common');

    return (
        <div className="space-y-4">
            {/* Header with refresh functionality */}
            <RefreshHeader
                titleKey="title"
                subtitle={t('subtitle', { timestamp: formatTime(new Date(insights.lastUpdated)) })}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={onRefetch}
                showLastUpdated={false}
                namespace="insights"
            >
                <Clock className="h-5 w-5 text-muted-foreground" />
            </RefreshHeader>

            <Card>
                <CardContent className="space-y-6 pt-6">
                    {/* Current Status Metrics */}
                    <MetricsGrid metrics={metricsData} columns={4} />

                    {/* Hour Progress */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{t('metrics.hourProgress')}</span>
                                    <span className="text-sm">{roundToDecimals(insights.hourProgress || 0, 0)}{tCommon('units.percent')}</span>
                                </div>
                                <Progress value={insights.hourProgress || 0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today's Totals */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('summaries.todayTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('summaries.totalUsageToday')}</p>
                                        <p className="text-xl font-bold">{roundUsage(insights.todayTotal?.usage || 0)} {tCommon('units.kWh')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(insights.trends?.usageChange || 0) > 0 ? '+' : ''}{roundUsage(insights.trends?.usageChange || 0)}{tCommon('units.percent')} {t('summaries.vsYesterday')}
                                        </p>
                                    </div>
                                    <StatusBadge
                                        status={(insights.trends?.usageChange || 0) > 10 ? "high" : (insights.trends?.usageChange || 0) > 0 ? "medium" : "low"}
                                        label={(insights.trends?.usageChange || 0) > 10 ? t('status.high') : (insights.trends?.usageChange || 0) > 0 ? t('status.above') : t('status.normal')}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('summaries.totalCostToday')}</p>
                                        <p className="text-xl font-bold">{roundCurrency(insights.todayTotal?.cost || 0)} {tCommon('units.bgn')}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(insights.trends?.costChange || 0) > 0 ? '+' : ''}{roundCurrency(insights.trends?.costChange || 0)}{tCommon('units.percent')} {t('summaries.vsYesterday')}
                                        </p>
                                    </div>
                                    <StatusBadge
                                        status={(insights.trends?.costChange || 0) > 10 ? "high" : (insights.trends?.costChange || 0) > 0 ? "medium" : "low"}
                                        label={(insights.trends?.costChange || 0) > 10 ? t('status.high') : (insights.trends?.costChange || 0) > 0 ? t('status.above') : t('status.normal')}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations using RecommendationsList */}
                    <RecommendationsList
                        recommendations={insights.recommendations || []}
                        titleKey="recommendations.title"
                        descriptionKey="recommendations.description"
                        emptyMessageKey="recommendations.emptyMessage"
                        namespace="insights"
                    />

                    {/* Efficiency Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">{t('efficiency.title')}</CardTitle>
                            <CardDescription>
                                {t('efficiency.description')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{t('metrics.currentEfficiency')}</span>
                                    <StatusBadge
                                        status={(insights.trends?.efficiencyScore || 0) >= 80 ? "good" : (insights.trends?.efficiencyScore || 0) >= 60 ? "medium" : "warning"}
                                        label={`${roundToDecimals(insights.trends?.efficiencyScore || 0, 0)}${tCommon('units.percent')}`}
                                    />
                                </div>
                                <Progress value={insights.trends?.efficiencyScore || 0} className="h-3" />
                                <p className="text-xs text-muted-foreground">
                                    {(insights.trends?.efficiencyScore || 0) >= 80 ?
                                        t('efficiency.excellent') :
                                        (insights.trends?.efficiencyScore || 0) >= 60 ?
                                            t('efficiency.good') :
                                            t('efficiency.needsImprovement')
                                    }
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
} 