"use client";

import { AlertCircle, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { HourlyData } from '../../types';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface HourlyChartProps {
    meteringPointId: string;
    date: string;
    title?: string;
}

export default function HourlyChart({ meteringPointId, date, title = "Hourly Electricity Data" }: HourlyChartProps) {
    const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (meteringPointId && date) {
            fetchHourlyData();
        }
    }, [meteringPointId, date]);

    const fetchHourlyData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/electricity/${meteringPointId}/hourly?date=${date}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch hourly data');
            }

            setHourlyData(data.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] bg-muted rounded animate-pulse"></div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
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
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                            <p className="text-2xl font-bold">{totalUsage.toFixed(1)} kWh</p>
                        </div>
                        <Zap className="h-8 w-8 text-blue-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                            <p className="text-2xl font-bold">{totalCost.toFixed(2)} BGN</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Price</p>
                            <p className="text-2xl font-bold">{avgPrice.toFixed(4)}</p>
                            <p className="text-xs text-muted-foreground">BGN/kWh</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-500" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Peak Usage</p>
                            <p className="text-2xl font-bold">{formatHour(peakUsageHour.hour)}</p>
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
                    <ResponsiveContainer width="100%" height={400}>
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
                                fill="#3B82F6"
                                name="Usage (kWh)"
                                opacity={0.7}
                            />

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="price"
                                stroke="#F59E0B"
                                strokeWidth={3}
                                name="Price (BGN/kWh)"
                                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                            />

                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="cost"
                                stroke="#EF4444"
                                strokeWidth={2}
                                name="Cost (BGN)"
                                dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                                strokeDasharray="5 5"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
} 