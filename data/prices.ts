import { PriceRecord } from '../src/types';
import { downloadFile, formatDatePath, parseJsonLines } from './gcs-client';

export async function getPricesForDate(date: Date): Promise<PriceRecord[]> {
    try {
        const { year, month, day } = formatDatePath(date);
        const filePath = `prices/${year}/${month}/${day}.jsonl`;

        const content = await downloadFile(filePath);
        const prices = parseJsonLines<PriceRecord>(content);

        return prices.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.error(`Failed to fetch prices for date ${date.toISOString()}:`, error);
        return [];
    }
}

export async function getPricesForDateRange(startDate: Date, endDate: Date): Promise<PriceRecord[]> {
    const allPrices: PriceRecord[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dayPrices = await getPricesForDate(new Date(currentDate));
        allPrices.push(...dayPrices);

        currentDate.setDate(currentDate.getDate() + 1);
    }

    return allPrices.sort((a, b) => a.timestamp - b.timestamp);
}

export async function getAveragePriceForDate(date: Date): Promise<number> {
    const prices = await getPricesForDate(date);

    if (prices.length === 0) {
        return 0;
    }

    const total = prices.reduce((sum, price) => sum + price.price, 0);
    return total / prices.length;
}

export async function getPeakPriceHourForDate(date: Date): Promise<{ hour: number; price: number } | null> {
    const prices = await getPricesForDate(date);

    if (prices.length === 0) {
        return null;
    }

    const maxPrice = Math.max(...prices.map(p => p.price));
    const peakPriceRecord = prices.find(p => p.price === maxPrice);

    if (!peakPriceRecord) {
        return null;
    }

    const hour = new Date(peakPriceRecord.timestamp * 1000).getHours();
    return { hour, price: maxPrice };
}

export async function getLowestPriceHourForDate(date: Date): Promise<{ hour: number; price: number } | null> {
    const prices = await getPricesForDate(date);

    if (prices.length === 0) {
        return null;
    }

    const minPrice = Math.min(...prices.map(p => p.price));
    const lowPriceRecord = prices.find(p => p.price === minPrice);

    if (!lowPriceRecord) {
        return null;
    }

    const hour = new Date(lowPriceRecord.timestamp * 1000).getHours();
    return { hour, price: minPrice };
} 