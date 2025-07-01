"use client";

import {
    AlertCircle,
    AlertTriangle,
    CheckCircle,
    Clock,
    DollarSign,
    Info,
    RefreshCw,
    TrendingUp,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { RealTimeInsights } from '../../types';
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
    const [insights, setInsights] = useState<RealTimeInsights | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        if (meteringPointId) {
            fetchInsights();
        }
    }, [meteringPointId, date]);

    useEffect(() => {
        if (autoRefresh && meteringPointId) {
            const interval = setInterval(fetchInsights, refreshInterval);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, meteringPointId, refreshInterval]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            const url = date
                ? `/api/insights/${meteringPointId}?date=${date}`
                : `/api/insights/${meteringPointId}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch insights');
            }

            setInsights(data.data);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

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
            case 'high': return <AlertTriangle className="h-5 w-5 text-red-500" />;
            case 'medium': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
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
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getCurrentHourProgress = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        return (minutes / 60) * 100;
    };

    if (loading && !insights) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Real-Time Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-8 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Real-Time Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button
                        onClick={fetchInsights}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!insights) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Real-Time Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            No real-time data available for the selected metering point.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            <CardTitle>Real-Time Insights</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={fetchInsights}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                    <CardDescription>
                        Current conditions for metering point {meteringPointId}
                        {lastUpdated && (
                            <span className="block text-xs mt-1">
                                Last updated: {formatTime(lastUpdated)}
                            </span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Current Hour</p>
                                    <p className="text-2xl font-bold">{insights.currentHour}:00</p>
                                </div>
                                <Clock className="h-6 w-6 text-blue-500" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Usage</p>
                                    <p className="text-2xl font-bold">{insights.currentUsage.toFixed(1)}</p>
                                    <p className="text-xs text-muted-foreground">kWh</p>
                                </div>
                                <Zap className="h-6 w-6 text-blue-500" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Price</p>
                                    <p className="text-2xl font-bold">{insights.currentPrice.toFixed(4)}</p>
                                    <p className="text-xs text-muted-foreground">BGN/kWh</p>
                                </div>
                                <TrendingUp className="h-6 w-6 text-orange-500" />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center justify-between p-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Cost</p>
                                    <p className="text-2xl font-bold">{insights.currentCost.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">BGN</p>
                                </div>
                                <DollarSign className="h-6 w-6 text-green-500" />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                {getUrgencyIcon(insights.urgencyLevel)}
                                Current Recommendation
                                <Badge variant={getUrgencyVariant(insights.urgencyLevel)}>
                                    {insights.urgencyLevel.toUpperCase()}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Alert variant={insights.urgencyLevel === 'high' ? 'destructive' : 'default'}>
                                {getUrgencyIcon(insights.urgencyLevel)}
                                <AlertDescription className="pl-6 text-sm">
                                    {insights.recommendation}
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Hour Progress</CardTitle>
                            <CardDescription>
                                Current progress through hour {insights.currentHour}:00
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Hour {insights.currentHour}:00</span>
                                    <span>{Math.round(getCurrentHourProgress())}% complete</span>
                                </div>
                                <Progress value={getCurrentHourProgress()} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Start of hour</span>
                                    <span>End of hour</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {autoRefresh && (
                        <div className="flex items-center justify-center text-xs text-muted-foreground">
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Auto-refreshing every {refreshInterval / 1000} seconds
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 