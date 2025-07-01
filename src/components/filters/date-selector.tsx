"use client";

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

interface DateSelectorProps {
    selectedDate: string;
    onDateChange: (date: string) => void;
    availableDates?: string[];
    title?: string;
}

export default function DateSelector({
    selectedDate,
    onDateChange,
    availableDates = [],
    title = "Select Date"
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
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        return [
            {
                label: 'Today',
                value: today.toISOString().split('T')[0],
                available: isDateAvailable(today.toISOString().split('T')[0])
            },
            {
                label: 'Yesterday',
                value: yesterday.toISOString().split('T')[0],
                available: isDateAvailable(yesterday.toISOString().split('T')[0])
            },
            {
                label: 'Week Ago',
                value: weekAgo.toISOString().split('T')[0],
                available: isDateAvailable(weekAgo.toISOString().split('T')[0])
            }
        ];
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
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateChange(getDateAdjustment(-1))}
                        disabled={!canGoToPreviousDay()}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous Day
                    </Button>

                    <div className="text-center">
                        <p className="text-lg font-semibold">
                            {formatDateForDisplay(currentDate)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {currentDate}
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDateChange(getDateAdjustment(1))}
                        disabled={!canGoToNextDay()}
                    >
                        Next Day
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-2">
                    <label htmlFor="date-input" className="text-sm font-medium">
                        Select Specific Date:
                    </label>
                    <Input
                        id="date-input"
                        type="date"
                        value={formatDateForInput(currentDate)}
                        onChange={(e) => handleDateChange(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>

                <div className="space-y-2">
                    <p className="text-sm font-medium">Quick Select:</p>
                    <div className="flex flex-wrap gap-2">
                        {getQuickDateOptions().map((option) => (
                            <Button
                                key={option.label}
                                variant={currentDate === option.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleDateChange(option.value)}
                                disabled={!option.available}
                                className="relative"
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

                {availableDates.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Available Dates:</p>
                        <div className="text-xs text-muted-foreground">
                            {availableDates.length} date(s) available with data
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                            <div className="flex flex-wrap gap-1">
                                {availableDates.slice(0, 10).map((date) => (
                                    <Badge
                                        key={date}
                                        variant={currentDate === date ? "default" : "secondary"}
                                        className="cursor-pointer text-xs"
                                        onClick={() => handleDateChange(date)}
                                    >
                                        {new Date(date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </Badge>
                                ))}
                                {availableDates.length > 10 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{availableDates.length - 10} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Selected: {currentDate}</span>
                        <Badge variant={isDateAvailable(currentDate) ? "default" : "destructive"}>
                            {isDateAvailable(currentDate) ? "Data Available" : "No Data"}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 