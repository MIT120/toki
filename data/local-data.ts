import fs from 'fs';
import path from 'path';
import { PriceRecord, UsageRecord } from '../src/types';

const LOCAL_DATA_PATH = './gcs-data';

export async function getLocalPricesForDate(date: Date): Promise<PriceRecord[]> {
    try {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const filePath = path.join(LOCAL_DATA_PATH, year.toString(), month, `${day}.jsonl`);

        console.log(`📁 Trying local price file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.log(`📁 Local price file not found: ${filePath}`);
            return [];
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const prices = content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line) as PriceRecord);

        console.log(`✅ Loaded ${prices.length} price records from local file`);
        return prices.sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
        console.error('Error loading local price data:', error);
        return [];
    }
}

export async function getLocalUsageForMeteringPointAndDate(
    meteringPointId: string,
    date: Date
): Promise<UsageRecord[]> {
    try {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        const filePath = path.join(
            LOCAL_DATA_PATH,
            year.toString(),
            month,
            day,
            `${meteringPointId}.jsonl`
        );

        console.log(`📁 Trying local usage file: ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.log(`📁 Local usage file not found: ${filePath}`);
            return [];
        }

        const content = fs.readFileSync(filePath, 'utf-8');
        const usage = content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line) as UsageRecord);

        console.log(`✅ Loaded ${usage.length} usage records from local file`);
        return usage.sort((a, b) => a.timestamp - b.timestamp);

    } catch (error) {
        console.error('Error loading local usage data:', error);
        return [];
    }
}

export function getAvailableLocalDates(): string[] {
    try {
        const dates: string[] = [];
        const basePath = path.join(LOCAL_DATA_PATH, '2022');

        if (!fs.existsSync(basePath)) {
            return [];
        }

        // Check for available months
        const months = fs.readdirSync(basePath).filter(item =>
            fs.statSync(path.join(basePath, item)).isDirectory()
        );

        for (const month of months) {
            const monthPath = path.join(basePath, month);
            const days = fs.readdirSync(monthPath).filter(item => {
                const dayPath = path.join(monthPath, item);
                return fs.statSync(dayPath).isDirectory() || item.endsWith('.jsonl');
            });

            for (const day of days) {
                if (day.endsWith('.jsonl')) {
                    // Price file
                    const dayNum = day.replace('.jsonl', '');
                    dates.push(`2022-${month}-${dayNum}`);
                } else {
                    // Usage directory
                    dates.push(`2022-${month}-${day}`);
                }
            }
        }

        return [...new Set(dates)].sort();

    } catch (error) {
        console.error('Error getting available local dates:', error);
        return [];
    }
} 