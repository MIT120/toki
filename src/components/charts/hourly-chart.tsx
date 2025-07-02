"use client";

import { AlertCircle, DollarSign, TrendingUp, Zap } from 'lucide-react';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import { useHourlyDataQuery } from '../../hooks/use-hourly-data-query';
import RefreshHeader from '../common/refresh-header';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface HourlyData {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

interface HourlyChartProps {
    meteringPointId: string;
    date: string;
    title?: string;
}

export default function HourlyChart({ meteringPointId, date, title = "Hourly Electricity Data" }: HourlyChartProps) {
    const {
        data: hourlyData,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        isRefetching
    } = useHourlyDataQuery(meteringPointId, date, {
        enabled: !!meteringPointId && !!date,
        enableAnalytics: true,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{`Hour: ${formatHour(label)}`}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {`${entry.dataKey === 'usage' ? 'Usage' :
                                entry.dataKey === 'price' ? 'Price' : 'Cost'}: ${entry.value.toFixed(entry.dataKey === 'price' ? 4 : 2)} ${entry.dataKey === 'usage' ? 'kWh' :
                                    entry.dataKey === 'price' ? 'BGN/kWh' : 'BGN'
                                }`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>Loading hourly data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] bg-muted rounded animate-pulse"></div>
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
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
                </CardContent>
            </Card>
        );
    }

    if (!hourlyData || hourlyData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                        No data available for the selected date
                        <Button
                            onClick={() => refetch()}
                            disabled={isFetching}
                            variant="outline"
                            size="sm"
                            className="ml-4"
                        >
                            {isFetching ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const totalUsage = hourlyData.reduce((sum, item) => sum + item.usage, 0);
    const totalCost = hourlyData.reduce((sum, item) => sum + item.cost, 0);
    const avgPrice = hourlyData.reduce((sum, item) => sum + item.price, 0) / hourlyData.length;
    const peakUsageHour = hourlyData.reduce((max, item) => item.usage > max.usage ? item : max);
    const peakCostHour = hourlyData.reduce((max, item) => item.cost > max.cost ? item : max);

    return (
        <div className="space-y-4">
            {/* Header with refresh functionality */}
            <RefreshHeader
                title={title}
                subtitle={`Hourly breakdown for ${new Date(date).toLocaleDateString()}`}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={() => refetch()}
            />

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-4 lg:p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                            <p className="text-xl lg:text-2xl font-bold">{totalUsage.toFixed(1)} kWh</p>
                        </div>
                        <Zap className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-4 lg:p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                            <p className="text-xl lg:text-2xl font-bold">{totalCost.toFixed(2)} BGN</p>
                        </div>
                        <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-4 lg:p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                            <p className="text-xl lg:text-2xl font-bold">{avgPrice.toFixed(4)}</p>
                            <p className="text-xs text-muted-foreground">BGN/kWh</p>
                        </div>
                        <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-4 lg:p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Peak Usage</p>
                            <p className="text-xl lg:text-2xl font-bold">{formatHour(peakUsageHour.hour)}</p>
                            <p className="text-xs text-muted-foreground">{peakUsageHour.usage.toFixed(1)} kWh</p>
                        </div>
                        <Badge variant={peakCostHour.hour === peakUsageHour.hour ? "destructive" : "secondary"}>
                            {peakCostHour.hour === peakUsageHour.hour ? "High Cost" : "Normal"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>
                        Hourly electricity usage, pricing, and costs for {new Date(date).toLocaleDateString()}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <ResponsiveContainer width="100%" height={400} minWidth={300}>
                            <ComposedChart
                                data={hourlyData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis
                                    dataKey="hour"
                                    tickFormatter={formatHour}
                                    className="text-xs"
                                />
                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    className="text-xs"
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    className="text-xs"
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="usage"
                                    fill="#3b82f6"
                                    name="Usage (kWh)"
                                    radius={[2, 2, 0, 0]}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="Price (BGN/kWh)"
                                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="cost"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    name="Cost (BGN)"
                                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 