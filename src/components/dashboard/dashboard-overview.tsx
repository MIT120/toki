"use client";

import { AlertCircle, Clock, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DashboardOverview } from '../../types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';

interface DashboardOverviewProps {
    date?: string;
}

export default function DashboardOverviewComponent({ date }: DashboardOverviewProps) {
    const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, [date]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const url = date ? `/api/dashboard?date=${date}` : '/api/dashboard';
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch dashboard data');
            }

            setDashboardData(data.data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!dashboardData) {
        return null;
    }

    const { customer, meteringPoints, todayData, recentInsights, quickStats } = dashboardData;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Electricity Dashboard</h1>
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
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
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

                <Card>
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

                <Card>
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

                <Card>
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
                            <div key={meter.id} className="flex items-center justify-between space-x-4">
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
                                <Alert key={index}>
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
                        <Progress value={75} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            Good performance! Consider optimizing peak hour usage for better efficiency.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="h-8 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-4 bg-muted rounded w-2/3"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                            <div className="h-3 bg-muted rounded w-3/4"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <div className="h-5 bg-muted rounded w-1/3"></div>
                            <div className="h-3 bg-muted rounded w-2/3"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, j) => (
                                    <div key={j} className="h-4 bg-muted rounded"></div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 