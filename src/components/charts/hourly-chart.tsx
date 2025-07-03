"use client";

import { DollarSign, TrendingUp, Zap } from 'lucide-react';
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
import {
    calculateTotalCost,
    calculateTotalUsage,
    formatHour,
    roundCurrency,
    roundPrice,
    roundUsage
} from '../../utils/electricity-calculations';
import { MetricsGrid } from '../common/metrics-grid';
import { QueryStateWrapper } from '../common/query-state-wrapper';
import RefreshHeader from '../common/refresh-header';
import { StatusBadge } from '../common/status-badge';
import type { MetricData } from '../common/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import type {
    HourlyChartContentProps,
    HourlyChartProps,
    TooltipProps
} from './types';

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

    const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{`Hour: ${formatHour(Number(label) || 0)}`}</p>
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

    // Prepare metrics data when data is available
    const metricsData: MetricData[] = hourlyData ? (() => {
        const usageData = hourlyData.map(item => ({
            timestamp: item.hour * 3600, // Convert hour to fake timestamp
            kwh: item.usage
        }));

        const totalUsage = calculateTotalUsage(usageData);
        const totalCost = calculateTotalCost(usageData, new Map(hourlyData.map(item => [item.hour, item.price])));
        const avgPrice = hourlyData.length > 0 ? hourlyData.reduce((sum, item) => sum + item.price, 0) / hourlyData.length : 0;
        const peakUsageHour = hourlyData.reduce((max, item) => item.usage > max.usage ? item : max);
        const peakCostHour = hourlyData.reduce((max, item) => item.cost > max.cost ? item : max);

        return [
            {
                id: 'usage',
                title: 'Total Usage',
                value: `${roundUsage(totalUsage)} kWh`,
                icon: Zap,
                iconColor: 'text-blue-500'
            },
            {
                id: 'cost',
                title: 'Total Cost',
                value: `${roundCurrency(totalCost)} BGN`,
                icon: DollarSign,
                iconColor: 'text-green-500'
            },
            {
                id: 'price',
                title: 'Avg Price',
                value: roundPrice(avgPrice),
                description: 'BGN/kWh',
                icon: TrendingUp,
                iconColor: 'text-orange-500'
            },
            {
                id: 'peak',
                title: 'Peak Usage',
                value: formatHour(peakUsageHour.hour),
                description: `${roundUsage(peakUsageHour.usage)} kWh`,
                icon: TrendingUp,
                iconColor: 'text-purple-500',
                badge: <StatusBadge
                    status={peakCostHour.hour === peakUsageHour.hour ? "high" : "low"}
                    label={peakCostHour.hour === peakUsageHour.hour ? "High Cost" : "Normal"}
                />
            }
        ];
    })() : [];

    return (
        <QueryStateWrapper
            isLoading={isLoading}
            isError={isError}
            error={error}
            data={hourlyData}
            isEmpty={!hourlyData || hourlyData.length === 0}
            onRefetch={() => refetch()}
            isRefetching={isRefetching}
            isFetching={isFetching}
            errorTitle="Error Loading Hourly Data"
            noDataTitle="No Data Available"
            noDataMessage={`No data available for ${new Date(date).toLocaleDateString()}`}
            loadingComponent={
                <Card>
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>Loading hourly data...</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] bg-muted rounded animate-pulse"></div>
                    </CardContent>
                </Card>
            }
        >
            <HourlyChartContent
                title={title}
                date={date}
                hourlyData={hourlyData!}
                metricsData={metricsData}
                isRefetching={isRefetching}
                isFetching={isFetching}
                onRefetch={() => refetch()}
                CustomTooltip={CustomTooltip}
            />
        </QueryStateWrapper>
    );
}



function HourlyChartContent({
    title,
    date,
    hourlyData,
    metricsData,
    isRefetching,
    isFetching,
    onRefetch,
    CustomTooltip
}: HourlyChartContentProps) {
    return (
        <div className="space-y-4">
            {/* Header with refresh functionality */}
            <RefreshHeader
                title={title}
                subtitle={`Hourly breakdown for ${new Date(date).toLocaleDateString()}`}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={onRefetch}
            />

            {/* Metrics Grid */}
            <MetricsGrid metrics={metricsData} columns={4} />

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