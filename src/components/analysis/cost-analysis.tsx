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
import { useEffect, useState } from 'react';
import { CostAnalysis } from '../../types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';

interface CostAnalysisProps {
    meteringPointId: string;
    date: string;
}

export default function CostAnalysisComponent({ meteringPointId, date }: CostAnalysisProps) {
    const [costData, setCostData] = useState<CostAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (meteringPointId && date) {
            fetchCostAnalysis();
        }
    }, [meteringPointId, date]);

    const fetchCostAnalysis = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/electricity/${meteringPointId}/analysis?date=${date}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch cost analysis');
            }

            setCostData(data.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getEfficiencyScore = (costData: CostAnalysis) => {
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

    if (loading) {
        return (
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <div className="h-6 bg-muted rounded w-1/3"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="h-8 bg-muted rounded"></div>
                            <div className="h-4 bg-muted rounded"></div>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
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
                </AlertDescription>
            </Alert>
        );
    }

    const efficiencyScore = getEfficiencyScore(costData);
    const potentialSavings = costData.totalCost * 0.15; // Estimated 15% savings potential

    return (
        <div className="space-y-6">
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

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Cost per kWh</span>
                                <span>{costData.averagePrice.toFixed(4)} BGN</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Peak Usage Hour</span>
                                <span>{costData.peakUsageHour}:00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Peak Cost Hour</span>
                                <span>{costData.peakCostHour}:00</span>
                            </div>
                            <div className="flex justify-between text-sm font-medium">
                                <span>Potential Savings</span>
                                <span className="text-green-600">{potentialSavings.toFixed(2)} BGN</span>
                            </div>
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
                            AI-powered suggestions to optimize your electricity costs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {costData.suggestions.length > 0 ? (
                            costData.suggestions.map((suggestion, index) => (
                                <Alert key={index} variant={getSuggestionVariant(suggestion) === "destructive" ? "destructive" : "default"}>
                                    {getSuggestionIcon(suggestion)}
                                    <AlertDescription className="text-sm pl-6">
                                        {suggestion}
                                    </AlertDescription>
                                </Alert>
                            ))
                        ) : (
                            <Alert>
                                <CheckCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No specific recommendations for today. Your energy usage patterns look optimal!
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daily Summary</CardTitle>
                    <CardDescription>
                        Complete breakdown for {new Date(date).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Usage Analysis</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Total Consumption:</span>
                                    <span className="font-medium">{costData.totalKwh.toFixed(2)} kWh</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Peak Usage Hour:</span>
                                    <span className="font-medium">{costData.peakUsageHour}:00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Hourly Usage:</span>
                                    <span className="font-medium">{(costData.totalKwh / 24).toFixed(2)} kWh</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Cost Analysis</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Total Cost:</span>
                                    <span className="font-medium">{costData.totalCost.toFixed(2)} BGN</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Average Price:</span>
                                    <span className="font-medium">{costData.averagePrice.toFixed(4)} BGN/kWh</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cost per Hour:</span>
                                    <span className="font-medium">{(costData.totalCost / 24).toFixed(2)} BGN</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Optimization</h4>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>Efficiency Score:</span>
                                    <span className="font-medium">{efficiencyScore}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Potential Savings:</span>
                                    <span className="font-medium text-green-600">{potentialSavings.toFixed(2)} BGN</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Recommendations:</span>
                                    <span className="font-medium">{costData.suggestions.length}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 