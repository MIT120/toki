"use client";

import { useEffect, useState } from 'react';
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
import { getAvailableDates } from '../src/services';

export default function ElectricityDashboard() {
    const [selectedDate, setSelectedDate] = useState('2022-05-27');
    const [selectedMeter, setSelectedMeter] = useState<string>('1234');
    const [availableDates, setAvailableDates] = useState<string[]>([]);
    const [isLoadingDates, setIsLoadingDates] = useState(true);

    const availableMeters = [
        { id: '1234', name: 'Main Bakery', location: 'Production Floor' },
        { id: '5678', name: 'Retail Store', location: 'Customer Area' }
    ];

    // Load available dates dynamically
    useEffect(() => {
        async function loadAvailableDates() {
            try {
                setIsLoadingDates(true);
                const dates = await getAvailableDates();
                setAvailableDates(dates);

                // If current selected date is not available, select the first available date
                if (!dates.includes(selectedDate) && dates.length > 0) {
                    setSelectedDate(dates[0]);
                }
            } catch (error) {
                console.error('Failed to load available dates:', error);
                // Fallback to hardcoded dates
                const fallbackDates = [
                    '2022-05-25',
                    '2022-05-26',
                    '2022-05-27',
                    '2022-05-28',
                    '2022-05-29'
                ];
                setAvailableDates(fallbackDates);
            } finally {
                setIsLoadingDates(false);
            }
        }

        loadAvailableDates();
    }, [selectedDate]);

    const currentMeter = availableMeters.find(m => m.id === selectedMeter);

    return (
        <Navigation>
            <div className="min-h-screen bg-background">
                <div className="container mx-auto p-4 lg:p-6 space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                                Electricity Management
                            </h1>
                            <p className="text-muted-foreground text-sm lg:text-base">
                                Monitor and optimize your bakery's energy consumption
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <div className="flex flex-col gap-2">
                                <Badge variant="secondary" className="text-sm">
                                    🔋 GCS + Local Data Active
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                    Real Data Available
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Main Dashboard Grid */}
                    <div className="grid gap-6 lg:grid-cols-4">
                        {/* Sidebar - Controls */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Metering Point Selector */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Metering Point</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select value={selectedMeter} onValueChange={setSelectedMeter}>
                                        <SelectTrigger className="w-full">
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
                                        <div className="mt-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                                            <h3 className="font-semibold text-sm">{currentMeter.name}</h3>
                                            <p className="text-xs text-muted-foreground mb-2">{currentMeter.location}</p>
                                            <Badge variant="secondary" className="text-xs">
                                                ID: {currentMeter.id}
                                            </Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Date Selector */}
                            <DateSelector
                                selectedDate={selectedDate}
                                onDateChange={setSelectedDate}
                                availableDates={availableDates}
                                title="Analysis Date"
                                isLoading={isLoadingDates}
                            />
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-3">
                            <Tabs defaultValue="overview" className="space-y-6">
                                {/* Tab Navigation */}
                                <div className="overflow-x-auto">
                                    <TabsList className="grid w-full min-w-[500px] lg:min-w-0 grid-cols-5">
                                        <TabsTrigger value="overview" className="text-xs lg:text-sm">
                                            Overview
                                        </TabsTrigger>
                                        <TabsTrigger value="charts" className="text-xs lg:text-sm">
                                            Charts
                                        </TabsTrigger>
                                        <TabsTrigger value="analysis" className="text-xs lg:text-sm">
                                            Analysis
                                        </TabsTrigger>
                                        <TabsTrigger value="insights" className="text-xs lg:text-sm">
                                            Insights
                                        </TabsTrigger>
                                        <TabsTrigger value="data" className="text-xs lg:text-sm">
                                            Data
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                {/* Tab Content */}
                                <div className="min-h-[400px]">
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
                                </div>
                            </Tabs>
                        </div>
                    </div>
                </div>
            </div>
        </Navigation>
    );
} 