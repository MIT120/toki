"use client";

import { AlertCircle, Clock, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { useDashboardAnalytics } from '../../contexts/analytics-context';
import { useDashboardQuery } from '../../hooks/use-dashboard-query';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

interface DashboardOverviewProps {
    date?: string;
}

export default function DashboardOverviewComponent({ date }: DashboardOverviewProps) {
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
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: false, // Manual refresh only
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

    // Loading state
    if (isLoading) {
        return <DashboardSkeleton />;
    }

    // Error state
    if (isError) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Dashboard</AlertTitle>
                <AlertDescription>
                    {errorMessage}
                    <div className="mt-2 flex gap-2">
                        <button
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            className="inline-flex items-center px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50"
                        >
                            {isRefetching ? 'Retrying...' : 'Try Again'}
                        </button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    // No data state
    if (!dashboardData) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Data Available</AlertTitle>
                <AlertDescription>
                    Dashboard data is not available at the moment.
                    <button
                        onClick={() => refetch()}
                        className="ml-2 underline hover:no-underline"
                    >
                        Refresh
                    </button>
                </AlertDescription>
            </Alert>
        );
    }

    const { customer, meteringPoints, todayData, recentInsights, quickStats } = dashboardData;

    return (
        <div className="space-y-6">
            {/* Header with refresh indicator */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">Electricity Dashboard</h1>
                        {(isFetching || isRefetching) && (
                            <div className="flex items-center text-sm text-muted-foreground">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted-foreground border-t-transparent mr-2" />
                                {isRefetching ? 'Refreshing...' : 'Loading...'}
                            </div>
                        )}
                    </div>
                    <p className="text-muted-foreground">
                        Welcome back, {customer.owner}! Here's your bakery's energy overview.
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Avatar>
                        <AvatarFallback>{customer.owner.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{meteringPoints.length} Meters</p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="ml-4 px-3 py-1 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                    >
                        {isRefetching ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleMetricCardClick('consumption')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Consumption</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayData.totalKwh.toFixed(1)} kWh</div>
                        <p className="text-xs text-muted-foreground">
                            {todayData.activeMeters} of {meteringPoints.length} meters active
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleMetricCardClick('cost')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayData.totalCost.toFixed(2)} BGN</div>
                        <p className="text-xs text-muted-foreground">
                            Avg: {todayData.averagePrice.toFixed(4)} BGN/kWh
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleMetricCardClick('peak_usage')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Peak Usage Hour</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{quickStats.peakUsageHour}:00</div>
                        <p className="text-xs text-muted-foreground">
                            Highest cost: {quickStats.highestCostMeter}
                        </p>
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleMetricCardClick('potential_savings', {
                        potential_savings: quickStats.potentialSavingsToday
                    })}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{quickStats.potentialSavingsToday.toFixed(2)} BGN</div>
                        <p className="text-xs text-muted-foreground">
                            Through optimization
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Metering Points and Insights */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Metering Points</CardTitle>
                        <CardDescription>
                            Status of your bakery locations
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {meteringPoints.map((meter) => (
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
                        <CardTitle>Recent Insights</CardTitle>
                        <CardDescription>
                            Smart recommendations for cost optimization
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentInsights.length > 0 ? (
                            recentInsights.map((insight, index) => (
                                <Alert
                                    key={index}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleInsightView(insight, index)}
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-sm">
                                        {insight}
                                    </AlertDescription>
                                </Alert>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No insights available for today. Check back later!
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Efficiency Score */}
            <Card>
                <CardHeader>
                    <CardTitle>Energy Efficiency Score</CardTitle>
                    <CardDescription>
                        Your bakery's performance today
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Efficiency Score</span>
                            <span>75%</span>
                        </div>
                        <Progress
                            value={75}
                            className="cursor-pointer"
                            onClick={() => handleEfficiencyScoreClick(75)}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Based on optimal usage patterns and cost efficiency
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