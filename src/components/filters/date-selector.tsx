"use client";

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import LoadingSkeleton from '../common/loading-skeleton';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

interface DateSelectorProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    availableDates?: string[];
    title?: string;
    isLoading?: boolean;
}

export default function DateSelector({
    selectedDate,
    onDateChange,
    availableDates = [],
    title = "Select Date",
    isLoading = false
}: DateSelectorProps) {
    const [currentDate, setCurrentDate] = useState(selectedDate);

    useEffect(() => {
        setCurrentDate(selectedDate);
    }, [selectedDate]);

    const formatDateForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    };

    const formatDateForDisplay = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateCompact = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getDateAdjustment = (days: number) => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + days);
        return date.toISOString().split('T')[0];
    };

    const handleDateChange = (newDate: string) => {
        setCurrentDate(newDate);
        onDateChange(newDate);
    };

    const isDateAvailable = (dateStr: string) => {
        if (availableDates.length === 0) return true;
        return availableDates.includes(dateStr);
    };

    const getQuickDateOptions = () => {
        // Use known valid dates from our GCS data range (April 2022)
        // Only dates 2022-04-10 to 2022-04-30 have complete data for both meters
        const validDates = [
            { label: 'April 15', value: '2022-04-15' },
            { label: 'April 20', value: '2022-04-20' },
            { label: 'April 25', value: '2022-04-25' }
        ];

        return validDates.map(date => ({
            ...date,
            available: isDateAvailable(date.value)
        }));
    };

    const canGoToPreviousDay = () => {
        const prevDate = getDateAdjustment(-1);
        return isDateAvailable(prevDate);
    };

    const canGoToNextDay = () => {
        const nextDate = getDateAdjustment(1);
        const today = new Date().toISOString().split('T')[0];
        return nextDate <= today && isDateAvailable(nextDate);
    };

    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Main Date Display and Navigation */}
                <div className="space-y-4">
                    {/* Date Navigation Row */}
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDateChange(getDateAdjustment(-1))}
                            disabled={isLoading || !canGoToPreviousDay()}
                            className="flex items-center gap-1 h-9 px-3"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDateChange(getDateAdjustment(1))}
                            disabled={isLoading || !canGoToNextDay()}
                            className="flex items-center gap-1 h-9 px-3"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Current Date Display */}
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4 text-center border border-primary/20">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-primary">Selected Date</p>
                            <p className="text-lg font-bold text-foreground hidden sm:block">
                                {formatDateForDisplay(currentDate)}
                            </p>
                            <p className="text-lg font-bold text-foreground sm:hidden">
                                {formatDateCompact(currentDate)}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                                {currentDate}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Date Input */}
                <div className="space-y-2">
                    <label htmlFor="date-input" className="text-sm font-medium text-foreground">
                        Select Specific Date
                    </label>
                    <Input
                        id="date-input"
                        type="date"
                        value={formatDateForInput(currentDate)}
                        onChange={(e) => handleDateChange(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        disabled={isLoading}
                        className="w-full"
                    />
                </div>

                {/* Quick Select Options */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Quick Select</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {getQuickDateOptions().map((option) => (
                            <Button
                                key={option.label}
                                variant={currentDate === option.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleDateChange(option.value)}
                                disabled={!option.available}
                                className="w-full justify-center relative"
                            >
                                {option.label}
                                {!option.available && (
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                        N/A
                                    </Badge>
                                )}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Available Dates */}
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">Available Dates</p>
                            <Badge variant="secondary" className="text-xs animate-pulse">
                                Loading...
                            </Badge>
                        </div>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                            <LoadingSkeleton variant="default" rows={2} showHeader={false} className="space-y-1" />
                        </div>
                    </div>
                ) : availableDates.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">Available Dates</p>
                            <Badge variant="secondary" className="text-xs">
                                {availableDates.length} available
                            </Badge>
                        </div>
                        <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                                {availableDates.slice(0, 12).map((date) => (
                                    <Badge
                                        key={date}
                                        variant={currentDate === date ? "default" : "secondary"}
                                        className="cursor-pointer text-xs justify-center hover:bg-primary/20 transition-colors"
                                        onClick={() => handleDateChange(date)}
                                    >
                                        {new Date(date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </Badge>
                                ))}
                                {availableDates.length > 12 && (
                                    <Badge variant="outline" className="text-xs justify-center">
                                        +{availableDates.length - 12}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Data Status Indicator */}
                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Data Status:</span>
                        <Badge
                            variant={isDateAvailable(currentDate) ? "default" : "destructive"}
                            className="text-xs"
                        >
                            {isDateAvailable(currentDate) ? "✓ Available" : "✗ No Data"}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 