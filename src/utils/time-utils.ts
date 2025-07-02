export function getHourFromTimestamp(timestamp: number): number {
    return new Date(timestamp * 1000).getHours();
}

export function formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
}

export function createTimestampForHour(date: Date, hour: number): number {
    const timestamp = new Date(date);
    timestamp.setHours(hour, 0, 0, 0);
    return Math.floor(timestamp.getTime() / 1000);
}

export function isNightHour(hour: number): boolean {
    return hour >= 22 || hour <= 5;
}

export function isMorningPeakHour(hour: number): boolean {
    return hour >= 8 && hour <= 10;
}

export function isEveningPeakHour(hour: number): boolean {
    return hour >= 18 && hour <= 21;
}

export function isPeakHour(hour: number): boolean {
    return isMorningPeakHour(hour) || isEveningPeakHour(hour);
}

export function getBakeryUsageMultiplier(hour: number): number {
    if (hour >= 5 && hour <= 10) return 1.8; // Morning rush
    if (hour >= 11 && hour <= 14) return 1.4; // Lunch prep
    if (hour >= 15 && hour <= 18) return 1.2; // Afternoon
    if (hour >= 22 || hour <= 4) return 0.3; // Night
    return 1; // Default
}

export function getBasePriceForHour(hour: number): number {
    if (isMorningPeakHour(hour)) return 0.18; // Morning peak
    if (isEveningPeakHour(hour)) return 0.16; // Evening peak
    if (isNightHour(hour)) return 0.08; // Off-peak night
    return 0.12; // Base price
}

export function filterByHourRange(
    data: { timestamp: number }[],
    startHour: number,
    endHour: number
): typeof data {
    return data.filter(item => {
        const hour = getHourFromTimestamp(item.timestamp);
        if (startHour <= endHour) {
            return hour >= startHour && hour <= endHour;
        } else {
            // Handle overnight ranges (e.g., 22 to 5)
            return hour >= startHour || hour <= endHour;
        }
    });
}

export function groupByHour<T extends { timestamp: number }>(
    data: T[]
): Record<number, T[]> {
    const grouped: Record<number, T[]> = {};

    for (const item of data) {
        const hour = getHourFromTimestamp(item.timestamp);
        if (!grouped[hour]) {
            grouped[hour] = [];
        }
        grouped[hour].push(item);
    }

    return grouped;
} 