"use client";

import {
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Lightbulb,
    Target,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useCostAnalysisQuery } from '../../hooks/use-cost-analysis-query';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';

interface CostAnalysisProps {
    meteringPointId: string;
    date: string;
}

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

    const getEfficiencyScore = (costData: any) => {
        const baseScore = 60;
        const usageBonus = Math.max(0, 20 - (costData.totalKwh / 10));
        const priceBonus = Math.max(0, 20 - (costData.averagePrice * 100));
        return Math.min(100, Math.round(baseScore + usageBonus + priceBonus));
    };

    const getSuggestionIcon = (suggestion: string) => {
        if (suggestion.toLowerCase().includes('high') || suggestion.toLowerCase().includes('alert')) {
            return <AlertTriangle className="h-4 w-4 text-red-500" />;
        }
        if (suggestion.toLowerCase().includes('consider') || suggestion.toLowerCase().includes('timing')) {
            return <Clock className="h-4 w-4 text-blue-500" />;
        }
        return <Lightbulb className="h-4 w-4 text-yellow-500" />;
    };

    const getSuggestionVariant = (suggestion: string): "default" | "secondary" | "destructive" | "outline" => {
        if (suggestion.toLowerCase().includes('high') || suggestion.toLowerCase().includes('alert')) {
            return "destructive";
        }
        if (suggestion.toLowerCase().includes('great') || suggestion.toLowerCase().includes('good')) {
            return "default";
        }
        return "outline";
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
                <AlertTitle>Error</AlertTitle>
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

    if (!costData) {
        return (
            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Data</AlertTitle>
                <AlertDescription>
                    No cost analysis data available for {new Date(date).toLocaleDateString()}
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

    const efficiencyScore = getEfficiencyScore(costData);
    const potentialSavings = costData.totalCost * 0.15; // Estimated 15% savings potential

    return (
        <div className="space-y-6">
            {/* Header with refresh indicator */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Cost Analysis</h3>
                    {(isFetching || isRefetching) && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-muted-foreground border-t-transparent mr-2" />
                            {isRefetching ? 'Refreshing...' : 'Loading...'}
                        </div>
                    )}
                </div>
                <Button
                    onClick={() => refetch()}
                    disabled={isRefetching}
                    variant="outline"
                    size="sm"
                >
                    {isRefetching ? 'Refreshing...' : 'Refresh'}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                            <p className="text-2xl font-bold">{costData.totalKwh.toFixed(1)} kWh</p>
                        </div>
                        <Zap className="h-8 w-8 text-blue-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                            <p className="text-2xl font-bold">{costData.totalCost.toFixed(2)} BGN</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                            <p className="text-2xl font-bold">{costData.averagePrice.toFixed(4)}</p>
                            <p className="text-xs text-muted-foreground">BGN/kWh</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Peak Hour</p>
                            <p className="text-2xl font-bold">{costData.peakUsageHour}:00</p>
                            <p className="text-xs text-muted-foreground">Usage peak</p>
                        </div>
                        <Clock className="h-8 w-8 text-purple-500" />
                    </CardContent>
                </Card>
            </div>

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
                                    {potentialSavings.toFixed(2)} BGN
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Estimated monthly savings through optimization
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Smart Recommendations
                        </CardTitle>
                        <CardDescription>
                            AI-powered suggestions to reduce your energy costs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {costData.suggestions && costData.suggestions.length > 0 ? (
                            costData.suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors"
                                >
                                    {getSuggestionIcon(suggestion)}
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm">{suggestion}</p>
                                        <Badge variant={getSuggestionVariant(suggestion)} className="text-xs">
                                            {suggestion.toLowerCase().includes('high') ? 'High Priority' :
                                                suggestion.toLowerCase().includes('consider') ? 'Medium Priority' :
                                                    'Low Priority'}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <p className="text-sm text-muted-foreground">
                                    Your energy usage is optimized! No specific recommendations at this time.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
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
                            <p className="text-xl font-bold">{(costData.totalCost / costData.totalKwh).toFixed(4)} BGN</p>
                            <p className="text-xs text-muted-foreground">Average rate paid</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Peak Cost Hour</p>
                            <p className="text-xl font-bold">{costData.peakCostHour || costData.peakUsageHour}:00</p>
                            <p className="text-xs text-muted-foreground">Highest cost period</p>
                        </div>
                        <div className="text-center p-4 rounded-lg border">
                            <p className="text-sm text-muted-foreground">Daily Average</p>
                            <p className="text-xl font-bold">{(costData.totalKwh / 24).toFixed(2)} kWh/h</p>
                            <p className="text-xs text-muted-foreground">Hourly consumption</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 