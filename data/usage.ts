import { UsageRecord } from '../src/types';
import { downloadFile } from './gcs-client';

function formatDatePath(date: Date): { year: string; month: string; day: string } {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return { year, month, day };
}

function parseJsonLines<T>(content: string): T[] {
    if (!content || content.trim() === '') {
        return [];
    }

    try {
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line) as T);
    } catch (error) {
        console.warn('Failed to parse JSON Lines data:', error);
        return [];
    }
}

export async function getUsageForMeteringPointAndDate(meteringPointId: string, date: Date): Promise<UsageRecord[]> {
    try {
        const { year, month, day } = formatDatePath(date);
        const filePath = `usage/${year}/${month}/${day}/${meteringPointId}.jsonl`;

        console.log(`🔍 Getting usage for ${meteringPointId} on ${date.toISOString().split('T')[0]} from GCS`);

        const content = await downloadFile(filePath);

        if (!content || !content.trim()) {
            console.log(`❌ No usage data found in GCS for ${meteringPointId} on ${date.toISOString().split('T')[0]}`);
            return [];
        }

        const usage = parseJsonLines<UsageRecord>(content);
        console.log(`✅ Using GCS usage data: ${usage.length} records`);
        return usage.sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
        console.error(`❌ Failed to fetch usage from GCS for ${meteringPointId} on ${date.toISOString().split('T')[0]}:`, error);
        return [];
    }
}

export async function getUsageForMeteringPointAndDateRange(
    meteringPointId: string,
    startDate: Date,
    endDate: Date
): Promise<UsageRecord[]> {
    const allUsage: UsageRecord[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayUsage = await getUsageForMeteringPointAndDate(meteringPointId, new Date(currentDate));
        allUsage.push(...dayUsage);

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return allUsage.sort((a, b) => a.timestamp - b.timestamp);
}

export async function getTotalUsageForMeteringPointAndDate(meteringPointId: string, date: Date): Promise<number> {
    const usage = await getUsageForMeteringPointAndDate(meteringPointId, date);
    return usage.reduce((total, record) => total + record.kwh, 0);
}

export async function getAverageUsageForMeteringPointAndDate(meteringPointId: string, date: Date): Promise<number> {
    const usage = await getUsageForMeteringPointAndDate(meteringPointId, date);

    if (usage.length === 0) {
        return 0;
    }

    const total = usage.reduce((sum, record) => sum + record.kwh, 0);
    return total / usage.length;
}

export async function getPeakUsageHourForMeteringPointAndDate(
    meteringPointId: string,
    date: Date
): Promise<{ hour: number; kwh: number } | null> {
    const usage = await getUsageForMeteringPointAndDate(meteringPointId, date);

    if (usage.length === 0) {
        return null;
    }

    const maxUsage = Math.max(...usage.map(u => u.kwh));
    const peakUsageRecord = usage.find(u => u.kwh === maxUsage);

    if (!peakUsageRecord) {
        return null;
    }

    const hour = new Date(peakUsageRecord.timestamp * 1000).getHours();
    return { hour, kwh: maxUsage };
}

export async function getLowestUsageHourForMeteringPointAndDate(
    meteringPointId: string,
    date: Date
): Promise<{ hour: number; kwh: number } | null> {
    const usage = await getUsageForMeteringPointAndDate(meteringPointId, date);

    if (usage.length === 0) {
        return null;
    }

    const minUsage = Math.min(...usage.map(u => u.kwh));
    const lowUsageRecord = usage.find(u => u.kwh === minUsage);

    if (!lowUsageRecord) {
        return null;
    }

    const hour = new Date(lowUsageRecord.timestamp * 1000).getHours();
    return { hour, kwh: minUsage };
}

export async function getUsageByHourForMeteringPointAndDate(
    meteringPointId: string,
    date: Date
): Promise<Record<number, number>> {
    const usage = await getUsageForMeteringPointAndDate(meteringPointId, date);
    const usageByHour: Record<number, number> = {};

    for (const record of usage) {
        const hour = new Date(record.timestamp * 1000).getHours();
        usageByHour[hour] = (usageByHour[hour] || 0) + record.kwh;
    }

    return usageByHour;
} 