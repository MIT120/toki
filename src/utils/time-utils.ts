import {
    formatHour,
    getHourFromTimestamp,
    timestampToDate
} from './electricity-calculations';

/**
 * Time utilities for bakery electricity data
 */

// Re-export time utilities for backward compatibility
export { formatHour, getHourFromTimestamp, timestampToDate };

export function formatTimeFromTimestamp(timestamp: number): string {
    const date = timestampToDate(timestamp);
    return date.toLocaleTimeString();
}

export function formatDateFromTimestamp(timestamp: number): string {
    const date = timestampToDate(timestamp);
    return date.toLocaleDateString();
}

export function getISODateFromTimestamp(timestamp: number): string {
    return timestampToDate(timestamp).toISOString().split('T')[0];
}

export function isValidTimestamp(timestamp: number): boolean {
    const date = timestampToDate(timestamp);
    return !isNaN(date.getTime()) && date.getFullYear() > 1970;
}

export function formatTimestamp(timestamp: number, format: 'ISO' | 'date' | 'time' | 'datetime' = 'ISO'): string {
    const date = timestampToDate(timestamp);

    switch (format) {
        case 'ISO':
            return date.toISOString();
        case 'date':
            return date.toISOString().split('T')[0];
        case 'time':
            return `${formatHour(date.getHours())}:${date.getMinutes().toString().padStart(2, '0')}`;
        case 'datetime':
            return `${date.toISOString().split('T')[0]} ${formatHour(date.getHours())}:${date.getMinutes().toString().padStart(2, '0')}`;
        default:
            return date.toISOString();
    }
}

export function getDateFromTimestamp(timestamp: number): string {
    return timestampToDate(timestamp).toISOString().split('T')[0];
}

export function isSameHour(timestamp1: number, timestamp2: number): boolean {
    return getHourFromTimestamp(timestamp1) === getHourFromTimestamp(timestamp2);
}

export function isSameDay(timestamp1: number, timestamp2: number): boolean {
    const date1 = getDateFromTimestamp(timestamp1);
    const date2 = getDateFromTimestamp(timestamp2);
    return date1 === date2;
}

export function groupByHour<T extends { timestamp: number }>(data: T[]): Map<number, T[]> {
    const grouped = new Map<number, T[]>();

    for (const item of data) {
        const hour = getHourFromTimestamp(item.timestamp);
        if (!grouped.has(hour)) {
            grouped.set(hour, []);
        }
        grouped.get(hour)!.push(item);
    }

    return grouped;
}

export function groupByDate<T extends { timestamp: number }>(data: T[]): Map<string, T[]> {
    const grouped = new Map<string, T[]>();

    for (const item of data) {
        const date = getDateFromTimestamp(item.timestamp);
        if (!grouped.has(date)) {
            grouped.set(date, []);
        }
        grouped.get(date)!.push(item);
    }

    return grouped;
}

export function sortByTimestamp<T extends { timestamp: number }>(data: T[], ascending: boolean = true): T[] {
    return [...data].sort((a, b) => ascending ? a.timestamp - b.timestamp : b.timestamp - a.timestamp);
}

export function getTimeRange<T extends { timestamp: number }>(data: T[]): {
    start: number;
    end: number;
    startFormatted: string;
    endFormatted: string;
    duration: number;
} | null {
    if (data.length === 0) return null;

    const sorted = sortByTimestamp(data);
    const start = sorted[0].timestamp;
    const end = sorted[sorted.length - 1].timestamp;

    return {
        start,
        end,
        startFormatted: formatTimestamp(start, 'datetime'),
        endFormatted: formatTimestamp(end, 'datetime'),
        duration: (end - start) / 3600
    };
}

export function createTimeSlots(startHour: number, endHour: number): Array<{
    hour: number;
    formatted: string;
    label: string;
}> {
    const slots = [];
    let current = startHour;

    while (current !== endHour) {
        slots.push({
            hour: current,
            formatted: formatHour(current),
            label: `${formatHour(current)} - ${formatHour((current + 1) % 24)}`
        });
        current = (current + 1) % 24;
    }

    return slots;
}

export function getBusinessHours(): { start: number; end: number; hours: number[] } {
    return {
        start: 8,
        end: 18,
        hours: Array.from({ length: 11 }, (_, i) => i + 8)
    };
}

export function getOffPeakHours(): { hours: number[] } {
    const businessHours = getBusinessHours().hours;
    const allHours = Array.from({ length: 24 }, (_, i) => i);

    return {
        hours: allHours.filter(hour => !businessHours.includes(hour))
    };
} 