"use client";

import {
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Info,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useInsightsQuery } from '../../hooks/use-insights-query';
import RefreshHeader from '../common/refresh-header';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

interface RealTimeInsightsProps {
    meteringPointId: string;
    date?: string;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export default function RealTimeInsightsComponent({
    meteringPointId,
    date,
    autoRefresh = true,
    refreshInterval = 60000
}: RealTimeInsightsProps) {
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

    const getUrgencyColor = (urgencyLevel: 'low' | 'medium' | 'high') => {
        switch (urgencyLevel) {
            case 'high': return 'text-red-500';
            case 'medium': return 'text-yellow-500';
            case 'low': return 'text-green-500';
            default: return 'text-gray-500';
        }
    };

    const getUrgencyIcon = (urgencyLevel: 'low' | 'medium' | 'high') => {
        switch (urgencyLevel) {
            case 'high': return <AlertTriangle className={`h-5 w-5 ${getUrgencyColor(urgencyLevel)}`} />;
            case 'medium': return <AlertCircle className={`h-5 w-5 ${getUrgencyColor(urgencyLevel)}`} />;
            case 'low': return <Info className={`h-5 w-5 ${getUrgencyColor(urgencyLevel)}`} />;
            default: return <Info className="h-5 w-5 text-gray-500" />;
        }
    };

    const getUrgencyVariant = (urgencyLevel: 'low' | 'medium' | 'high') => {
        switch (urgencyLevel) {
            case 'high': return 'destructive' as const;
            case 'medium': return 'outline' as const;
            case 'low': return 'default' as const;
            default: return 'secondary' as const;
        }
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).format(date);
    };

    const getCurrentHourProgress = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        return (minutes / 60) * 100;
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-2/3 animate-pulse"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="h-8 bg-muted rounded animate-pulse"></div>
                            <div className="h-4 bg-muted rounded animate-pulse"></div>
                            <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isError) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading Insights</AlertTitle>
                <AlertDescription>
                    {errorMessage}
                    <div className="mt-2">
                        <Button
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            variant="outline"
                            size="sm"
                        >
                            {isRefetching ? 'Retrying...' : 'Try Again'}
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    if (!insights) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Insights Available</AlertTitle>
                <AlertDescription>
                    Real-time insights are not available at the moment.
                    <div className="mt-2">
                        <Button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            variant="outline"
                            size="sm"
                        >
                            {isFetching ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with refresh functionality */}
            <RefreshHeader
                title="Real-Time Insights"
                subtitle={`Live monitoring and AI-powered recommendations • Last updated: ${formatTime(new Date(insights.lastUpdated))}`}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={() => refetch()}
                showLastUpdated={false}
            >
                <Clock className="h-5 w-5 text-muted-foreground" />
            </RefreshHeader>

            <Card>
                <CardContent className="space-y-6 pt-6">
                    {/* Current Status */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Current Usage</p>
                                        <p className="text-2xl font-bold">{(insights.currentUsage || 0).toFixed(2)} kWh</p>
                                    </div>
                                    <Zap className="h-8 w-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Current Cost</p>
                                        <p className="text-2xl font-bold">{(insights.currentCost || 0).toFixed(2)} BGN</p>
                                    </div>
                                    <DollarSign className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Current Price</p>
                                        <p className="text-2xl font-bold">{(insights.currentPrice || 0).toFixed(4)}</p>
                                        <p className="text-xs text-muted-foreground">BGN/kWh</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Hour Progress</p>
                                        <p className="text-2xl font-bold">{(insights.hourProgress || 0).toFixed(0)}%</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-purple-500" />
                                </div>
                                <Progress value={insights.hourProgress || 0} className="mt-2 h-2" />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Today's Totals */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Today's Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Usage Today</p>
                                        <p className="text-xl font-bold">{(insights.todayTotal?.usage || 0).toFixed(2)} kWh</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(insights.trends?.usageChange || 0) > 0 ? '+' : ''}{(insights.trends?.usageChange || 0).toFixed(1)}% vs yesterday
                                        </p>
                                    </div>
                                    <Badge variant={(insights.trends?.usageChange || 0) > 10 ? "destructive" : (insights.trends?.usageChange || 0) > 0 ? "outline" : "default"}>
                                        {(insights.trends?.usageChange || 0) > 10 ? "High" : (insights.trends?.usageChange || 0) > 0 ? "Above" : "Normal"}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Cost Today</p>
                                        <p className="text-xl font-bold">{(insights.todayTotal?.cost || 0).toFixed(2)} BGN</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(insights.trends?.costChange || 0) > 0 ? '+' : ''}{(insights.trends?.costChange || 0).toFixed(1)}% vs yesterday
                                        </p>
                                    </div>
                                    <Badge variant={(insights.trends?.costChange || 0) > 10 ? "destructive" : (insights.trends?.costChange || 0) > 0 ? "outline" : "default"}>
                                        {(insights.trends?.costChange || 0) > 10 ? "High" : (insights.trends?.costChange || 0) > 0 ? "Above" : "Normal"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Smart Recommendations</CardTitle>
                            <CardDescription>
                                AI-powered suggestions based on your current usage patterns
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {insights.recommendations && insights.recommendations.length > 0 ? (
                                insights.recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-4 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors"
                                    >
                                        {getUrgencyIcon(rec.urgencyLevel)}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Badge variant={getUrgencyVariant(rec.urgencyLevel)} className="text-xs">
                                                    {rec.urgencyLevel.toUpperCase()} PRIORITY
                                                </Badge>
                                                {rec.potentialSavings && (
                                                    <span className="text-sm font-semibold text-green-600">
                                                        Save {(rec.potentialSavings || 0).toFixed(2)} BGN
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm">{rec.message}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="text-xs">
                                                    {rec.type.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <p className="text-sm text-muted-foreground">
                                        Your current usage is optimized! No immediate recommendations.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Efficiency Score */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Efficiency Score</CardTitle>
                            <CardDescription>
                                Your real-time energy efficiency rating
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Current Efficiency</span>
                                    <Badge variant={(insights.trends?.efficiencyScore || 0) >= 80 ? "default" : (insights.trends?.efficiencyScore || 0) >= 60 ? "secondary" : "destructive"}>
                                        {(insights.trends?.efficiencyScore || 0).toFixed(0)}%
                                    </Badge>
                                </div>
                                <Progress value={insights.trends?.efficiencyScore || 0} className="h-3" />
                                <p className="text-xs text-muted-foreground">
                                    {(insights.trends?.efficiencyScore || 0) >= 80 ?
                                        "Excellent! Your energy usage is highly optimized." :
                                        (insights.trends?.efficiencyScore || 0) >= 60 ?
                                            "Good efficiency with room for improvement." :
                                            "Consider implementing the recommendations above to improve efficiency."
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