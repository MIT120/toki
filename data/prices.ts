import { PriceRecord } from '../src/types';
import { downloadFile } from './gcs-client';
import { getLocalPricesForDate } from './local-data';

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

export async function getPricesForDate(date: Date): Promise<PriceRecord[]> {
    try {
        const { year, month, day } = formatDatePath(date);
        const filePath = `prices/${year}/${month}/${day}.jsonl`;

        console.log(`🔍 Attempting to get prices for ${date.toISOString().split('T')[0]} from GCS`);

        // Try GCS first
        try {
            const content = await downloadFile(filePath);

            if (content && content.trim()) {
                const prices = parseJsonLines<PriceRecord>(content);
                console.log(`✅ Using real GCS price data: ${prices.length} records`);
                return prices.sort((a, b) => a.timestamp - b.timestamp);
            }
        } catch (gcsError) {
            console.log(`⚠️  GCS fetch failed for ${filePath}:`, gcsError instanceof Error ? gcsError.message : String(gcsError));
        }

        // Fallback to local data
        console.log(`🔄 GCS data not available, trying local data...`);
        const localPrices = await getLocalPricesForDate(date);

        if (localPrices.length > 0) {
            console.log(`✅ Using local price data: ${localPrices.length} records`);
            return localPrices;
        }

        console.log(`⚠️  No price data found (GCS or local) for ${date.toISOString().split('T')[0]}`);
        return [];

    } catch (error) {
        console.error(`Failed to fetch prices for date ${date.toISOString()}:`, error);

        // Try local data as final fallback
        try {
            console.log(`🔄 Error occurred, trying local data as fallback...`);
            const localPrices = await getLocalPricesForDate(date);
            if (localPrices.length > 0) {
                console.log(`✅ Using local price data after error: ${localPrices.length} records`);
                return localPrices;
            }
        } catch (localError) {
            console.error('Local data fallback also failed:', localError);
        }

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