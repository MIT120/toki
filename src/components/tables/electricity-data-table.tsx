"use client";

import {
    ChevronDown,
    ChevronUp,
    Download,
    Search
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
import QueryStateWrapper from '../common/query-state-wrapper';
import RefreshHeader from '../common/refresh-header';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import type {
    ElectricityDataRow,
    ElectricityDataTableContentProps,
    ElectricityDataTableProps,
    SortDirection,
    SortField
} from './types';

export default function ElectricityDataTable({
    meteringPointId,
    date,
    title = "Hourly Electricity Data"
}: ElectricityDataTableProps) {
    const { t } = useTranslation('tables');
    const { t: tCommon } = useTranslation('common');

    const {
        data: rawData,
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

    const [filteredData, setFilteredData] = useState<ElectricityDataRow[]>([]);
    const [sortField, setSortField] = useState<SortField>('hour');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    // Update filtered data when raw data, search term, or sort options change
    useEffect(() => {
        if (!rawData) {
            setFilteredData([]);
            return;
        }

        let filtered = [...rawData];

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.hour.toString().includes(term) ||
                item.usage.toString().includes(term) ||
                item.price.toString().includes(term) ||
                item.cost.toString().includes(term)
            );
        }

        // Sort data
        filtered.sort((a, b) => {
            let aValue: number, bValue: number;

            switch (sortField) {
                case 'hour':
                    aValue = a.hour;
                    bValue = b.hour;
                    break;
                case 'usage':
                    aValue = a.usage;
                    bValue = b.usage;
                    break;
                case 'price':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'cost':
                    aValue = a.cost;
                    bValue = b.cost;
                    break;
                default:
                    aValue = a.hour;
                    bValue = b.hour;
            }

            if (sortDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });

        setFilteredData(filtered);
    }, [rawData, searchTerm, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getUsageBadgeColor = (usage: number, maxUsage: number) => {
        const percentage = (usage / maxUsage) * 100;
        if (percentage >= 80) return 'destructive';
        if (percentage >= 60) return 'outline';
        return 'secondary';
    };

    const getPriceBadgeColor = (price: number, avgPrice: number) => {
        if (price > avgPrice * 1.2) return 'destructive';
        if (price > avgPrice * 1.1) return 'outline';
        return 'default';
    };

    const exportToCSV = () => {
        if (!filteredData.length) return;

        const headers = ['Hour', 'Usage (kWh)', 'Price (BGN/kWh)', 'Cost (BGN)'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                formatHour(row.hour),
                roundUsage(row.usage),
                roundPrice(row.price),
                roundCurrency(row.cost)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `electricity-data-${meteringPointId}-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const loadingComponent = (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Loading electricity data...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="h-8 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                </div>
            </CardContent>
        </Card>
    );

    // Convert HourlyData to the format expected by calculation utilities
    const usageData = rawData ? rawData.map(item => ({
        timestamp: item.hour * 3600, // Convert hour to fake timestamp
        kwh: item.usage
    })) : [];

    // Use reusable calculation utilities
    const maxUsage = rawData ? Math.max(...rawData.map(d => d.usage)) : 0;
    // Calculate average price directly from simple data
    const avgPrice = rawData && rawData.length > 0 ? rawData.reduce((sum, d) => sum + d.price, 0) / rawData.length : 0;
    const totalUsage = calculateTotalUsage(usageData);
    const totalCost = calculateTotalCost(usageData, rawData ? new Map(rawData.map(item => [item.hour, item.price])) : new Map());

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />;
    };

    const defaultTitle = title || t('electricity.title');

    return (
        <QueryStateWrapper
            isLoading={isLoading}
            isError={isError}
            error={error}
            data={rawData}
            isEmpty={!rawData || rawData.length === 0}
            onRefetch={() => refetch()}
            isRefetching={isRefetching}
            isFetching={isFetching}
            errorTitle="Error Loading Electricity Data"
            noDataTitle="No Data Available"
            noDataMessage={t('electricity.noResults', { searchTerm })}
            loadingComponent={loadingComponent}
        >
            <ElectricityDataTableContent
                title={defaultTitle}
                date={date}
                rawData={rawData!}
                filteredData={filteredData}
                sortField={sortField}
                sortDirection={sortDirection}
                searchTerm={searchTerm}
                maxUsage={maxUsage}
                avgPrice={avgPrice}
                totalUsage={totalUsage}
                totalCost={totalCost}
                isRefetching={isRefetching}
                isFetching={isFetching}
                onRefetch={() => refetch()}
                onSort={handleSort}
                onSearchChange={setSearchTerm}
                onExportCSV={exportToCSV}
            />
        </QueryStateWrapper>
    );
}

function ElectricityDataTableContent({
    title,
    date,
    rawData,
    filteredData,
    sortField,
    sortDirection,
    searchTerm,
    maxUsage,
    avgPrice,
    totalUsage,
    totalCost,
    isRefetching,
    isFetching,
    onRefetch,
    onSort,
    onSearchChange,
    onExportCSV
}: ElectricityDataTableContentProps) {
    const { t } = useTranslation('tables');
    const { t: tCommon } = useTranslation('common');

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />;
    };

    const getUsageBadgeColor = (usage: number, maxUsage: number) => {
        const percentage = (usage / maxUsage) * 100;
        if (percentage >= 80) return 'destructive';
        if (percentage >= 60) return 'outline';
        return 'secondary';
    };

    const getPriceBadgeColor = (price: number, avgPrice: number) => {
        if (price > avgPrice * 1.2) return 'destructive';
        if (price > avgPrice * 1.1) return 'outline';
        return 'default';
    };

    return (
        <div className="space-y-4">
            {/* Header with refresh functionality */}
            <RefreshHeader
                title={title}
                subtitle={t('electricity.dataFor', {
                    date: new Date(date).toLocaleDateString(),
                    count: filteredData.length,
                    total: rawData.length
                })}
                isRefreshing={isRefetching}
                isFetching={isFetching}
                onRefresh={onRefetch}
            >
                <Button
                    onClick={onExportCSV}
                    variant="outline"
                    size="sm"
                    disabled={!filteredData.length}
                >
                    <Download className="h-4 w-4 mr-2" />
                    {t('electricity.exportCSV')}
                </Button>
            </RefreshHeader>

            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('electricity.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <div className="text-center">
                            <p className="text-2xl font-bold">{roundUsage(totalUsage)} {tCommon('units.kWh')}</p>
                            <p className="text-sm text-muted-foreground">{t('electricity.totalUsage')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{roundCurrency(totalCost)} {tCommon('units.bgn')}</p>
                            <p className="text-sm text-muted-foreground">{t('electricity.totalCost')}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold">{roundPrice(avgPrice)}</p>
                            <p className="text-sm text-muted-foreground">{t('electricity.avgPrice')}</p>
                        </div>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => onSort('hour')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>{t('electricity.hour')}</span>
                                            <SortIcon field="hour" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => onSort('usage')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>{t('electricity.usage')}</span>
                                            <SortIcon field="usage" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => onSort('price')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>{t('electricity.price')}</span>
                                            <SortIcon field="price" />
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => onSort('cost')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>{t('electricity.cost')}</span>
                                            <SortIcon field="cost" />
                                        </div>
                                    </TableHead>
                                    <TableHead>{t('electricity.status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((row) => (
                                    <TableRow key={row.hour}>
                                        <TableCell className="font-medium">
                                            {formatHour(row.hour)}
                                        </TableCell>
                                        <TableCell>{roundUsage(row.usage)}</TableCell>
                                        <TableCell>{roundPrice(row.price)}</TableCell>
                                        <TableCell>{roundCurrency(row.cost)}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-1">
                                                <Badge variant={getUsageBadgeColor(row.usage, maxUsage)}>
                                                    {row.usage >= maxUsage * 0.8 ? t('electricity.usageStatus.high') :
                                                        row.usage >= maxUsage * 0.6 ? t('electricity.usageStatus.med') : t('electricity.usageStatus.low')}
                                                </Badge>
                                                <Badge variant={getPriceBadgeColor(row.price, avgPrice)}>
                                                    {row.price > avgPrice * 1.2 ? t('electricity.priceStatus.high') :
                                                        row.price > avgPrice * 1.1 ? t('electricity.priceStatus.med') : t('electricity.priceStatus.low')}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {filteredData.length === 0 && searchTerm && (
                        <div className="text-center py-8 text-muted-foreground">
                            {t('electricity.noResults', { searchTerm })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 