"use client";

import {
    Clock,
    DollarSign,
    Target,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useCostAnalysisQuery } from '../../hooks/use-cost-analysis-query';
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
import type { MetricData } from '../common/types';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import type {
    CostAnalysisContentProps,
    CostAnalysisData,
    CostAnalysisProps
} from './types';

export default function CostAnalysisComponent({ meteringPointId, date }: CostAnalysisProps) {
    const { t } = useTranslation('analysis');
    const { t: tCommon } = useTranslation('common');

    const {
        data: costData,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        isRefetching
    } = useCostAnalysisQuery(meteringPointId, date, {
        enabled: !!meteringPointId && !!date,
        enableAnalytics: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Prepare metrics data for MetricsGrid
    const metricsData: MetricData[] = costData ? [
        {
            id: 'usage',
            titleKey: 'metrics.totalUsage',
            value: `${roundUsage(costData.totalKwh)} ${tCommon('units.kWh')}`,
            icon: Zap,
            iconColor: 'text-blue-500',
            namespace: 'analysis'
        },
        {
            id: 'cost',
            titleKey: 'metrics.totalCost',
            value: `${roundCurrency(costData.totalCost)} ${tCommon('units.bgn')}`,
            icon: DollarSign,
            iconColor: 'text-green-500',
            namespace: 'analysis'
        },
        {
            id: 'price',
            titleKey: 'metrics.avgPrice',
            value: roundPrice(costData.averagePrice),
            description: tCommon('units.bgnPerKwh'),
            icon: TrendingUp,
            iconColor: 'text-orange-500',
            namespace: 'analysis'
        },
        {
            id: 'peak',
            titleKey: 'metrics.peakHour',
            value: `${costData.peakUsageHour}:00`,
            descriptionKey: 'descriptions.usagePeak',
            icon: Clock,
            iconColor: 'text-purple-500',
            namespace: 'analysis'
        }
    ] : [];

    return (
        <QueryStateWrapper
            isLoading={isLoading}
            isError={isError}
            error={error}
            data={costData}
            onRefetch={() => refetch()}
            isRefetching={isRefetching}
            isFetching={isFetching}
            errorTitle={tCommon('errors.general')}
            noDataTitle={tCommon('labels.noData')}
            noDataMessage={tCommon('placeholders.noDataMessage')}
        >
            <CostAnalysisContent
                costData={costData!}
                date={date}
                isRefetching={isRefetching}
                isFetching={isFetching}
                onRefetch={() => refetch()}
                metricsData={metricsData}
            />
        </QueryStateWrapper>
    );
}



function CostAnalysisContent({
    costData,
    date,
    isRefetching,
    isFetching,
    onRefetch,
    metricsData
}: CostAnalysisContentProps) {
    const { t } = useTranslation('analysis');
    const { t: tCommon } = useTranslation('common');

    const getEfficiencyScore = (costData: CostAnalysisData) => {
        const baseScore = 60;
        const usageBonus = Math.max(0, 20 - (costData.totalKwh / 10));
        const priceBonus = Math.max(0, 20 - (costData.averagePrice * 100));
        return Math.min(100, roundToDecimals(baseScore + usageBonus + priceBonus, 0));
    };

    const efficiencyScore = getEfficiencyScore(costData);
    const potentialSavings = roundCurrency(costData.totalCost * 0.15);

    const getEfficiencyMessage = (score: number) => {
        if (score >= 80) return t('efficiency.excellent');
        if (score >= 60) return t('efficiency.good');
        return t('efficiency.needsImprovement');
    };

    return (
        <div className="space-y-6">
            {/* Header with refresh functionality */}
            <RefreshHeader
                titleKey="title"
                subtitle={t('subtitle', { date: new Date(date).toLocaleDateString() })}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={onRefetch}
                namespace="analysis"
            />

            {/* Metrics Grid */}
            <MetricsGrid metrics={metricsData} columns={4} />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            {t('metrics.efficiency')}
                        </CardTitle>
                        <CardDescription>
                            {t('descriptions.efficiencyScore', { date: new Date(date).toLocaleDateString() })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{t('efficiency.score')}</span>
                                <Badge variant={efficiencyScore >= 80 ? "default" : efficiencyScore >= 60 ? "secondary" : "destructive"}>
                                    {efficiencyScore}{tCommon('units.percent')}
                                </Badge>
                            </div>
                            <Progress value={efficiencyScore} className="h-3" />
                            <p className="text-xs text-muted-foreground">
                                {getEfficiencyMessage(efficiencyScore)}
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{t('savings.potential')}</span>
                                <span className="text-sm font-bold text-green-600">
                                    {potentialSavings} {tCommon('units.bgn')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t('savings.monthly')}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <RecommendationsList
                    recommendations={costData.suggestions || []}
                    titleKey="recommendations.title"
                    descriptionKey="recommendations.description"
                    emptyMessageKey="recommendations.emptyMessage"
                    namespace="analysis"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('breakdown.title')}</CardTitle>
                    <CardDescription>
                        {t('breakdown.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">{t('breakdown.costPerKwh')}</p>
                            <p className="text-lg font-bold">{roundPrice(costData.averagePrice)}</p>
                            <p className="text-xs text-muted-foreground">{tCommon('units.bgnPerKwh')}</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">{t('breakdown.totalHours')}</p>
                            <p className="text-lg font-bold">24</p>
                            <p className="text-xs text-muted-foreground">{tCommon('units.hours')}</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">{t('breakdown.averageUsage')}</p>
                            <p className="text-lg font-bold">{roundUsage(costData.totalKwh / 24)}</p>
                            <p className="text-xs text-muted-foreground">{tCommon('units.kWh')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 