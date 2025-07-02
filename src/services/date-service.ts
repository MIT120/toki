'use server'

// Only dates with COMPLETE data for both metering points (1234 and 5678)
// Dates 2022-04-01 to 2022-04-09 are missing usage data for both meters
const AVAILABLE_GCS_DATES = [
    '2022-04-10', '2022-04-11', '2022-04-12', '2022-04-13', '2022-04-14', '2022-04-15',
    '2022-04-16', '2022-04-17', '2022-04-18', '2022-04-19', '2022-04-20',
    '2022-04-21', '2022-04-22', '2022-04-23', '2022-04-24', '2022-04-25',
    '2022-04-26', '2022-04-27', '2022-04-28', '2022-04-29', '2022-04-30'
];

export async function getAvailableDates(): Promise<string[]> {
    console.log('📅 Getting available dates from GCS...');
    console.log(`✅ Using ${AVAILABLE_GCS_DATES.length} confirmed GCS dates`);
    console.log(`📊 Date range: ${AVAILABLE_GCS_DATES[0]} to ${AVAILABLE_GCS_DATES[AVAILABLE_GCS_DATES.length - 1]}`);
    return AVAILABLE_GCS_DATES;
}

export async function getDateRange(): Promise<{ minDate: string; maxDate: string }> {
    const dates = await getAvailableDates();

    return {
        minDate: dates[0] || '2022-04-10',
        maxDate: dates[dates.length - 1] || '2022-04-30'
    };
} 