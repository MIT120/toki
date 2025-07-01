"use client";

import { useState } from 'react';
import { Badge } from '../src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../src/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../src/components/ui/tabs';

import CostAnalysisComponent from '../src/components/analysis/cost-analysis';
import HourlyChart from '../src/components/charts/hourly-chart';
import DashboardOverviewComponent from '../src/components/dashboard/dashboard-overview';
import DateSelector from '../src/components/filters/date-selector';
import RealTimeInsightsComponent from '../src/components/insights/real-time-insights';
import Navigation from '../src/components/layout/navigation';
import ElectricityDataTable from '../src/components/tables/electricity-data-table';

export default function ElectricityDashboard() {
    const [selectedDate, setSelectedDate] = useState('2022-05-27');
    const [selectedMeter, setSelectedMeter] = useState<string>('1234');

    const availableMeters = [
        { id: '1234', name: 'Main Bakery', location: 'Production Floor' },
        { id: '5678', name: 'Retail Store', location: 'Customer Area' }
    ];

    const availableDates = [
        '2022-05-25',
        '2022-05-26',
        '2022-05-27',
        '2022-05-28',
        '2022-05-29'
    ];

    const currentMeter = availableMeters.find(m => m.id === selectedMeter);

    return (
        <Navigation>
            <div className="container mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Electricity Management</h1>
                        <p className="text-muted-foreground">
                            Monitor and optimize your bakery's energy consumption
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Badge variant="secondary" className="text-sm">
                            🔋 Demo Mode - Mock Data
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            GCS Billing Disabled
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Metering Point</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select value={selectedMeter} onValueChange={setSelectedMeter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select meter" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableMeters.map((meter) => (
                                            <SelectItem key={meter.id} value={meter.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{meter.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {meter.location} • ID: {meter.id}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {currentMeter && (
                                    <div className="mt-4 p-3 bg-muted rounded-lg">
                                        <h3 className="font-semibold text-sm">{currentMeter.name}</h3>
                                        <p className="text-xs text-muted-foreground">{currentMeter.location}</p>
                                        <Badge variant="secondary" className="mt-2">
                                            ID: {currentMeter.id}
                                        </Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <div className="mt-6">
                            <DateSelector
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                availableDates={availableDates}
                                title="Analysis Date"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <Tabs defaultValue="overview" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-5">
                                <TabsTrigger value="overview">Overview</TabsTrigger>
                                <TabsTrigger value="charts">Charts</TabsTrigger>
                                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                                <TabsTrigger value="insights">Insights</TabsTrigger>
                                <TabsTrigger value="data">Data</TabsTrigger>
                            </TabsList>

                            <TabsContent value="overview" className="space-y-6">
                                <DashboardOverviewComponent date={selectedDate} />
                            </TabsContent>

                            <TabsContent value="charts" className="space-y-6">
                                <HourlyChart
                                    meteringPointId={selectedMeter}
                                    date={selectedDate}
                                    title={`Hourly Data - ${currentMeter?.name || 'Selected Meter'}`}
                                />
                            </TabsContent>

                            <TabsContent value="analysis" className="space-y-6">
                                <CostAnalysisComponent
                                    meteringPointId={selectedMeter}
                                    date={selectedDate}
                                />
                            </TabsContent>

                            <TabsContent value="insights" className="space-y-6">
                                <RealTimeInsightsComponent
                                    meteringPointId={selectedMeter}
                                    date={selectedDate}
                                    autoRefresh={true}
                                    refreshInterval={60000}
                                />
                            </TabsContent>

                            <TabsContent value="data" className="space-y-6">
                                <ElectricityDataTable
                                    meteringPointId={selectedMeter}
                                    date={selectedDate}
                                    title={`Detailed Data - ${currentMeter?.name || 'Selected Meter'}`}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </Navigation>
    );
} 