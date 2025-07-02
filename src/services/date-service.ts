'use server'

import { getAvailableLocalDates } from '../../data/local-data';

export async function getAvailableDates(): Promise<string[]> {
    console.log('📅 Getting available dates...');

    try {
        const dates = getAvailableLocalDates();
        console.log(`✅ Found ${dates.length} available dates`);
        return dates;
    } catch (error) {
        console.error('❌ Error getting available dates:', error);

        // Fallback to known dates
        return [
            '2022-05-25',
            '2022-05-26',
            '2022-05-27',
            '2022-05-28',
            '2022-05-29'
        ];
    }
}

export async function getDateRange(): Promise<{ minDate: string; maxDate: string }> {
    const dates = await getAvailableDates();

    return {
        minDate: dates[0] || '2022-05-25',
        maxDate: dates[dates.length - 1] || '2022-05-29'
    };
} 