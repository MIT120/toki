"use client";

import { Clock, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { useDashboardAnalytics } from '../../contexts/analytics-context';
import { useDashboardQuery } from '../../hooks/use-dashboard-query';
import { useTranslation } from '../../hooks/use-translation';
import {
    roundCurrency,
    roundPrice,
    roundUsage
} from '../../utils/electricity-calculations';
import LoadingSkeleton from '../common/loading-skeleton';
import MetricsGrid from '../common/metrics-grid';
import QueryStateWrapper from '../common/query-state-wrapper';
import RefreshHeader from '../common/refresh-header';
import { Alert, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import type {
    DashboardContentProps,
    DashboardOverviewProps
} from './types';

export default function DashboardOverviewComponent({ date }: DashboardOverviewProps) {
    const { t } = useTranslation('dashboard');
    const { t: tCommon } = useTranslation('common');

    // Use React Query for data fetching (already includes analytics)
    const {
        data: dashboardData,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        isRefetching
    } = useDashboardQuery({
        date,
        enabled: true,
        enableAnalytics: true,
        staleTime: 1000 * 60 * 5,
        refetchInterval: false,
    });

    // Use analytics directly from context
    const analytics = useDashboardAnalytics();

    // Analytics handlers
    const handleMeteringPointClick = async (meteringPoint: { id: string; name: string; location?: string }) => {
        if (analytics.isInitialized) {
            await analytics.trackMeteringPointInteraction(
                meteringPoint.id,
                meteringPoint.name || meteringPoint.id,
                'view',
                {
                    location: meteringPoint.location,
                }
            );
        }
    };

    const handleInsightView = async (insight: string, index: number) => {
        if (analytics.isInitialized) {
            await analytics.trackInsightView(
                'dashboard_insight',
                'medium',
                undefined
            );

            await analytics.trackEvent('insight_clicked', {
                insight_content: insight.substring(0, 100),
                insight_index: index,
                component_name: 'DashboardOverview',
            });
        }
    };

    const handleMetricCardClick = async (metricType: string, additionalProps?: Record<string, any>) => {
        if (analytics.isInitialized) {
            await analytics.trackEvent('metric_card_clicked', {
                metric_type: metricType,
                component_name: 'DashboardOverview',
                ...additionalProps,
            });
        }
    };

    const handleEfficiencyScoreClick = async (score: number) => {
        if (analytics.isInitialized) {
            await analytics.trackEvent('efficiency_score_clicked', {
                efficiency_score: score,
                component_name: 'DashboardOverview',
            });
        }
    };

    // Prepare metrics data when data is available
    const metricsData = dashboardData ? [
        {
            id: 'consumption',
            title: t('metrics.todayUsage'),
            value: `${roundUsage(dashboardData.todayData.totalKwh)} ${tCommon('units.kWh')}`,
            description: `${dashboardData.todayData.activeMeters} of ${dashboardData.meteringPoints.length} meters ${tCommon('status.active')}`,
            icon: Zap,
            iconColor: 'text-blue-500',
            onClick: () => handleMetricCardClick('consumption')
        },
        {
            id: 'cost',
            title: t('metrics.todayCost'),
            value: `${roundCurrency(dashboardData.todayData.totalCost)} ${tCommon('units.bgn')}`,
            description: `Avg: ${roundPrice(dashboardData.todayData.averagePrice)} ${tCommon('units.bgn')}/${tCommon('units.kWh')}`,
            icon: DollarSign,
            iconColor: 'text-green-500',
            onClick: () => handleMetricCardClick('cost')
        },
        {
            id: 'peak_usage',
            title: t('metrics.peak'),
            value: `${dashboardData.quickStats.peakUsageHour}:00`,
            description: `Highest cost: ${dashboardData.quickStats.highestCostMeter}`,
            icon: Clock,
            iconColor: 'text-orange-500',
            onClick: () => handleMetricCardClick('peak_usage')
        },
        {
            id: 'potential_savings',
            title: t('metrics.savings'),
            value: `${roundCurrency(dashboardData.quickStats.potentialSavingsToday)} ${tCommon('units.bgn')}`,
            description: t('overview.throughOptimization'),
            icon: TrendingUp,
            iconColor: 'text-purple-500',
            onClick: () => handleMetricCardClick('potential_savings', {
                potential_savings: dashboardData.quickStats.potentialSavingsToday
            })
        }
    ] : [];

    return (
        <QueryStateWrapper
            isLoading={isLoading}
            isError={isError}
            error={error}
            data={dashboardData}
            onRefetch={() => refetch()}
            isRefetching={isRefetching}
            isFetching={isFetching}
            errorTitle="Error Loading Dashboard"
            noDataTitle={tCommon('labels.noData')}
            noDataMessage={t('overview.noDataMessage')}
            loadingComponent={<LoadingSkeleton variant="dashboard" />}
        >
            <DashboardContent
                dashboardData={dashboardData!}
                metricsData={metricsData}
                isRefetching={isRefetching}
                isFetching={isFetching}
                onRefetch={() => refetch()}
                analytics={{
                    handleMeteringPointClick,
                    handleInsightView,
                    handleMetricCardClick,
                    handleEfficiencyScoreClick
                }}
            />
        </QueryStateWrapper>
    );
}

function DashboardContent({
    dashboardData,
    metricsData,
    isRefetching,
    isFetching,
    onRefetch,
    analytics
}: DashboardContentProps) {
    const { t } = useTranslation('dashboard');
    const { customer, meteringPoints, todayData, recentInsights, quickStats } = dashboardData;
    const { handleMeteringPointClick, handleInsightView, handleMetricCardClick, handleEfficiencyScoreClick } = analytics;

    return (
        <div className="space-y-6">
            {/* Header with refresh functionality */}
            <RefreshHeader
                titleKey="overview.title"
                subtitle={t('overview.welcomeMessage', { owner: customer.owner })}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={onRefetch}
                namespace="dashboard"
                className="mb-6"
            >
                <div className="flex items-center space-x-2">
                    <Avatar>
                        <AvatarFallback>{customer.owner.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {meteringPoints.length} {t('cards.meteringPointsTitle')}
                        </p>
                    </div>
                </div>
            </RefreshHeader>

            {/* Metrics Grid */}
            <MetricsGrid metrics={metricsData} columns={4} />

            {/* Metering Points and Insights */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('cards.meteringPointsTitle')}</CardTitle>
                        <CardDescription>
                            {t('overview.meteringPointsDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {meteringPoints.map((meter: any) => (
                            <div
                                key={meter.id}
                                className="flex items-center justify-between space-x-4 p-2 rounded hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => handleMeteringPointClick(meter)}
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">{meter.name}</p>
                                    <p className="text-xs text-muted-foreground">{meter.location}</p>
                                </div>
                                <Badge variant="outline">
                                    ID: {meter.id}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('cards.recentActivity')}</CardTitle>
                        <CardDescription>
                            {t('overview.insightsDescription')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentInsights.length > 0 ? (
                            recentInsights.map((insight: any, index: number) => (
                                <Alert
                                    key={index}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleInsightView(insight, index)}
                                >
                                    <AlertDescription className="text-sm">
                                        {insight}
                                    </AlertDescription>
                                </Alert>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {t('overview.noInsightsMessage')}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Efficiency Score */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('metrics.efficiency')}</CardTitle>
                    <CardDescription>
                        {t('overview.efficiencyDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{t('metrics.efficiency')}</span>
                            <span>75%</span>
                        </div>
                        <Progress
                            value={75}
                            className="cursor-pointer"
                            onClick={() => handleEfficiencyScoreClick(75)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t('overview.efficiencyBasisDescription')}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-20 bg-muted rounded animate-pulse mb-2" />
                            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>

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
                                    <div className="space-y-2">
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
} 