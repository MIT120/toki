"use client";

import {
    AlertTriangle,
    Calendar,
    ChevronDown,
    ChevronUp,
    Download,
    Search
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { HourlyData } from '../../types';
import { Alert, AlertDescription } from '../ui/alert';
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

interface ElectricityDataTableProps {
    meteringPointId: string;
    date: string;
    title?: string;
}

type SortField = 'hour' | 'usage' | 'price' | 'cost';
type SortDirection = 'asc' | 'desc';

export default function ElectricityDataTable({
    meteringPointId,
    date,
    title = "Hourly Electricity Data"
}: ElectricityDataTableProps) {
    const [data, setData] = useState<HourlyData[]>([]);
    const [filteredData, setFilteredData] = useState<HourlyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>('hour');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (meteringPointId && date) {
            fetchData();
        }
    }, [meteringPointId, date]);

    useEffect(() => {
        filterAndSortData();
    }, [data, searchTerm, sortField, sortDirection]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/electricity/${meteringPointId}/hourly?date=${date}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch data');
            }

            setData(result.data || []);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortData = () => {
        let filtered = [...data];

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
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const formatHour = (hour: number) => {
        return `${hour.toString().padStart(2, '0')}:00`;
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
        const headers = ['Hour', 'Usage (kWh)', 'Price (BGN/kWh)', 'Cost (BGN)'];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(row => [
                formatHour(row.hour),
                row.usage.toFixed(2),
                row.price.toFixed(4),
                row.cost.toFixed(2)
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

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
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
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Calendar className="h-4 w-4" />
                        <AlertDescription>
                            No data available for {new Date(date).toLocaleDateString()}
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    const maxUsage = Math.max(...data.map(d => d.usage));
    const avgPrice = data.reduce((sum, d) => sum + d.price, 0) / data.length;
    const totalUsage = data.reduce((sum, d) => sum + d.usage, 0);
    const totalCost = data.reduce((sum, d) => sum + d.cost, 0);

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ?
            <ChevronUp className="h-4 w-4" /> :
            <ChevronDown className="h-4 w-4" />;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>
                            Data for {new Date(date).toLocaleDateString()} • {filteredData.length} of {data.length} hours
                        </CardDescription>
                    </div>
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search hours, usage, price, or cost..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{totalUsage.toFixed(1)} kWh</p>
                        <p className="text-sm text-muted-foreground">Total Usage</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{totalCost.toFixed(2)} BGN</p>
                        <p className="text-sm text-muted-foreground">Total Cost</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">{avgPrice.toFixed(4)}</p>
                        <p className="text-sm text-muted-foreground">Avg Price (BGN/kWh)</p>
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('hour')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Hour</span>
                                        <SortIcon field="hour" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('usage')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Usage (kWh)</span>
                                        <SortIcon field="usage" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('price')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Price (BGN/kWh)</span>
                                        <SortIcon field="price" />
                                    </div>
                                </TableHead>
                                <TableHead
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => handleSort('cost')}
                                >
                                    <div className="flex items-center space-x-1">
                                        <span>Cost (BGN)</span>
                                        <SortIcon field="cost" />
                                    </div>
                                </TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((row) => (
                                <TableRow key={row.hour}>
                                    <TableCell className="font-medium">
                                        {formatHour(row.hour)}
                                    </TableCell>
                                    <TableCell>{row.usage.toFixed(2)}</TableCell>
                                    <TableCell>{row.price.toFixed(4)}</TableCell>
                                    <TableCell>{row.cost.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <div className="flex space-x-1">
                                            <Badge variant={getUsageBadgeColor(row.usage, maxUsage)}>
                                                {row.usage >= maxUsage * 0.8 ? 'High' :
                                                    row.usage >= maxUsage * 0.6 ? 'Med' : 'Low'} Usage
                                            </Badge>
                                            <Badge variant={getPriceBadgeColor(row.price, avgPrice)}>
                                                {row.price > avgPrice * 1.2 ? 'High' :
                                                    row.price > avgPrice * 1.1 ? 'Med' : 'Low'} Price
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
                        No results found for "{searchTerm}"
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 