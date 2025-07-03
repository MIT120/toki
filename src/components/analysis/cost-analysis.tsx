"use client";

import {
    Clock,
    DollarSign,
    Target,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useCostAnalysisQuery } from '../../hooks/use-cost-analysis-query';
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
            title: 'Total Usage',
            value: `${roundUsage(costData.totalKwh)} kWh`,
            icon: Zap,
            iconColor: 'text-blue-500'
        },
        {
            id: 'cost',
            title: 'Total Cost',
            value: `${roundCurrency(costData.totalCost)} BGN`,
            icon: DollarSign,
            iconColor: 'text-green-500'
        },
        {
            id: 'price',
            title: 'Avg Price',
            value: roundPrice(costData.averagePrice),
            description: 'BGN/kWh',
            icon: TrendingUp,
            iconColor: 'text-orange-500'
        },
        {
            id: 'peak',
            title: 'Peak Hour',
            value: `${costData.peakUsageHour}:00`,
            description: 'Usage peak',
            icon: Clock,
            iconColor: 'text-purple-500'
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
            errorTitle="Error Loading Cost Analysis"
            noDataTitle="No Cost Data"
            noDataMessage={`No cost analysis data available for ${new Date(date).toLocaleDateString()}`}
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
    const getEfficiencyScore = (costData: CostAnalysisData) => {
        const baseScore = 60;
        const usageBonus = Math.max(0, 20 - (costData.totalKwh / 10));
        const priceBonus = Math.max(0, 20 - (costData.averagePrice * 100));
        return Math.min(100, roundToDecimals(baseScore + usageBonus + priceBonus, 0));
    };

    const efficiencyScore = getEfficiencyScore(costData);
    const potentialSavings = roundCurrency(costData.totalCost * 0.15);

    return (
        <div className="space-y-6">
            {/* Header with refresh functionality */}
            <RefreshHeader
                title="Cost Analysis"
                subtitle={`Detailed cost breakdown for ${new Date(date).toLocaleDateString()}`}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={onRefetch}
            />

            {/* Metrics Grid */}
            <MetricsGrid metrics={metricsData} columns={4} />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Efficiency Score
                        </CardTitle>
                        <CardDescription>
                            Your bakery's energy efficiency for {new Date(date).toLocaleDateString()}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Efficiency Score</span>
                                <Badge variant={efficiencyScore >= 80 ? "default" : efficiencyScore >= 60 ? "secondary" : "destructive"}>
                                    {efficiencyScore}%
                                </Badge>
                            </div>
                            <Progress value={efficiencyScore} className="h-3" />
                            <p className="text-xs text-muted-foreground">
                                {efficiencyScore >= 80 ? "Excellent performance!" :
                                    efficiencyScore >= 60 ? "Good performance with room for improvement." :
                                        "Consider optimizing your energy usage patterns."}
                            </p>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Potential Savings</span>
                                <span className="text-sm font-bold text-green-600">
                                    {potentialSavings} BGN
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Estimated monthly savings through optimization
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <RecommendationsList
                    recommendations={costData.suggestions || []}
                    title="Smart Recommendations"
                    description="AI-powered suggestions to reduce your energy costs"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Cost Breakdown Analysis</CardTitle>
                    <CardDescription>
                        Detailed analysis of your energy costs and usage patterns
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Cost per kWh</p>
                            <p className="text-xl font-bold">{roundPrice(costData.totalCost / costData.totalKwh)} BGN</p>
                            <p className="text-xs text-muted-foreground">Average rate paid</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Peak Cost Hour</p>
                            <p className="text-xl font-bold">{costData.peakCostHour || costData.peakUsageHour}:00</p>
                            <p className="text-xs text-muted-foreground">Highest cost period</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Daily Average</p>
                            <p className="text-xl font-bold">{roundUsage(costData.totalKwh / 24)} kWh/h</p>
                            <p className="text-xs text-muted-foreground">Hourly consumption</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 