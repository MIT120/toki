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
import { useTranslation } from '../../hooks/use-translation';
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

export default function HourlyChart({ meteringPointId, date, title }: HourlyChartProps) {
    const { t } = useTranslation('charts');
    const { t: tCommon } = useTranslation('common');

    const defaultTitle = t('titles.hourlyData');

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
                    <p className="font-medium">{t('tooltip.hour', { hour: formatHour(Number(label) || 0) })}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {`${entry.dataKey === 'usage' ? t('tooltip.usage') :
                                entry.dataKey === 'price' ? t('tooltip.price') : t('tooltip.cost')}: ${entry.value.toFixed(entry.dataKey === 'price' ? 4 : 2)} ${entry.dataKey === 'usage' ? tCommon('units.kWh') :
                                    entry.dataKey === 'price' ? tCommon('units.bgnPerKwh') : tCommon('units.bgn')
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
                titleKey: 'metrics.totalUsage',
                value: `${roundUsage(totalUsage)} ${tCommon('units.kWh')}`,
                icon: Zap,
                iconColor: 'text-blue-500',
                namespace: 'charts'
            },
            {
                id: 'cost',
                titleKey: 'metrics.totalCost',
                value: `${roundCurrency(totalCost)} ${tCommon('units.bgn')}`,
                icon: DollarSign,
                iconColor: 'text-green-500',
                namespace: 'charts'
            },
            {
                id: 'price',
                titleKey: 'metrics.avgPrice',
                value: roundPrice(avgPrice),
                description: tCommon('units.bgnPerKwh'),
                icon: TrendingUp,
                iconColor: 'text-orange-500',
                namespace: 'charts'
            },
            {
                id: 'peak',
                titleKey: 'metrics.peakUsage',
                value: formatHour(peakUsageHour.hour),
                description: `${roundUsage(peakUsageHour.usage)} ${tCommon('units.kWh')}`,
                icon: TrendingUp,
                iconColor: 'text-purple-500',
                namespace: 'charts',
                badge: <StatusBadge
                    status={peakCostHour.hour === peakUsageHour.hour ? "high" : "low"}
                    label={peakCostHour.hour === peakUsageHour.hour ? tCommon('status.highCost') : tCommon('status.normal')}
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
            errorTitle={t('errors.loadingData')}
            noDataTitle={t('errors.noDataAvailable')}
            noDataMessage={t('errors.noDataMessage', { date: new Date(date).toLocaleDateString() })}
            loadingComponent={
                <Card>
                    <CardHeader>
                        <CardTitle>{title || defaultTitle}</CardTitle>
                        <CardDescription>{t('loading.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px] bg-muted rounded animate-pulse"></div>
                    </CardContent>
                </Card>
            }
        >
            <HourlyChartContent
                title={title || defaultTitle}
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
    const { t } = useTranslation('charts');

    return (
        <div className="space-y-4">
            {/* Header with refresh functionality */}
            <RefreshHeader
                title={title}
                subtitle={t('subtitles.hourlyBreakdown', { date: new Date(date).toLocaleDateString() })}
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
                        {t('descriptions.hourlyData', { date: new Date(date).toLocaleDateString() })}
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
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="hour"
                                    tickFormatter={(hour) => formatHour(hour)}
                                    stroke="#888888"
                                    fontSize={12}
                                />
                                <YAxis
                                    yAxisId="left"
                                    orientation="left"
                                    stroke="#888888"
                                    fontSize={12}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#888888"
                                    fontSize={12}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="usage"
                                    name={t('legend.usage')}
                                    fill="#3b82f6"
                                    opacity={0.8}
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="cost"
                                    name={t('legend.cost')}
                                    fill="#10b981"
                                    opacity={0.8}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="price"
                                    name={t('legend.price')}
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 