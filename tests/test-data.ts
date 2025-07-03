import { PriceRecord, UsageRecord } from '../src/types';

// Test data based on real electricity usage patterns and Bulgarian energy prices
// Timestamps adjusted for local timezone (Eastern European Time)
export const MOCK_USAGE_DATA: UsageRecord[] = [
    // Early morning (low usage)
    { timestamp: 1651021200, kwh: 5.2 },  // 00:00 local (21:00 UTC prev day)
    { timestamp: 1651024800, kwh: 4.8 },  // 01:00 local (22:00 UTC prev day)
    { timestamp: 1651028400, kwh: 4.1 },  // 02:00 local (23:00 UTC prev day)
    { timestamp: 1651032000, kwh: 3.9 },  // 03:00 local (00:00 UTC)
    { timestamp: 1651035600, kwh: 4.5 },  // 04:00 local (01:00 UTC)
    { timestamp: 1651039200, kwh: 6.2 },  // 05:00 local (02:00 UTC)

    // Morning peak (high usage - baking begins)
    { timestamp: 1651042800, kwh: 12.8 }, // 06:00 local (03:00 UTC)
    { timestamp: 1651046400, kwh: 18.4 }, // 07:00 local (04:00 UTC)
    { timestamp: 1651050000, kwh: 22.6 }, // 08:00 local (05:00 UTC) - peak morning
    { timestamp: 1651053600, kwh: 19.2 }, // 09:00 local (06:00 UTC)
    { timestamp: 1651057200, kwh: 15.7 }, // 10:00 local (07:00 UTC)
    { timestamp: 1651060800, kwh: 13.1 }, // 11:00 local (08:00 UTC)

    // Midday (moderate usage)
    { timestamp: 1651064400, kwh: 11.8 }, // 12:00 local (09:00 UTC)
    { timestamp: 1651068000, kwh: 10.4 }, // 13:00 local (10:00 UTC)
    { timestamp: 1651071600, kwh: 9.8 },  // 14:00 local (11:00 UTC)
    { timestamp: 1651075200, kwh: 11.2 }, // 15:00 local (12:00 UTC)
    { timestamp: 1651078800, kwh: 12.5 }, // 16:00 local (13:00 UTC)
    { timestamp: 1651082400, kwh: 14.1 }, // 17:00 local (14:00 UTC)

    // Evening (moderate to high usage)
    { timestamp: 1651086000, kwh: 16.3 }, // 18:00 local (15:00 UTC)
    { timestamp: 1651089600, kwh: 13.9 }, // 19:00 local (16:00 UTC)
    { timestamp: 1651093200, kwh: 11.2 }, // 20:00 local (17:00 UTC)
    { timestamp: 1651096800, kwh: 8.7 },  // 21:00 local (18:00 UTC)
    { timestamp: 1651100400, kwh: 7.1 },  // 22:00 local (19:00 UTC)
    { timestamp: 1651104000, kwh: 6.2 },  // 23:00 local (20:00 UTC)
];

// Bulgarian electricity prices (BGN/kWh) with typical daily fluctuations
// Timestamps adjusted for local timezone (Eastern European Time)
export const MOCK_PRICE_DATA: PriceRecord[] = [
    // Night rates (lower prices)
    { timestamp: 1651021200, price: 0.0823, currency: 'BGN' }, // 00:00 local
    { timestamp: 1651024800, price: 0.0798, currency: 'BGN' }, // 01:00 local
    { timestamp: 1651028400, price: 0.0771, currency: 'BGN' }, // 02:00 local
    { timestamp: 1651032000, price: 0.0756, currency: 'BGN' }, // 03:00 local
    { timestamp: 1651035600, price: 0.0742, currency: 'BGN' }, // 04:00 local
    { timestamp: 1651039200, price: 0.0789, currency: 'BGN' }, // 05:00 local

    // Morning rates (higher prices)
    { timestamp: 1651042800, price: 0.0945, currency: 'BGN' }, // 06:00 local
    { timestamp: 1651046400, price: 0.1156, currency: 'BGN' }, // 07:00 local
    { timestamp: 1651050000, price: 0.1289, currency: 'BGN' }, // 08:00 local (peak price)
    { timestamp: 1651053600, price: 0.1198, currency: 'BGN' }, // 09:00 local
    { timestamp: 1651057200, price: 0.1087, currency: 'BGN' }, // 10:00 local
    { timestamp: 1651060800, price: 0.0998, currency: 'BGN' }, // 11:00 local

    // Midday rates (moderate prices)
    { timestamp: 1651064400, price: 0.0923, currency: 'BGN' }, // 12:00 local
    { timestamp: 1651068000, price: 0.0887, currency: 'BGN' }, // 13:00 local
    { timestamp: 1651071600, price: 0.0852, currency: 'BGN' }, // 14:00 local
    { timestamp: 1651075200, price: 0.0876, currency: 'BGN' }, // 15:00 local
    { timestamp: 1651078800, price: 0.0901, currency: 'BGN' }, // 16:00 local
    { timestamp: 1651082400, price: 0.0934, currency: 'BGN' }, // 17:00 local

    // Evening rates (higher prices)
    { timestamp: 1651086000, price: 0.1023, currency: 'BGN' }, // 18:00 local
    { timestamp: 1651089600, price: 0.1101, currency: 'BGN' }, // 19:00 local
    { timestamp: 1651093200, price: 0.1054, currency: 'BGN' }, // 20:00 local
    { timestamp: 1651096800, price: 0.0987, currency: 'BGN' }, // 21:00 local
    { timestamp: 1651100400, price: 0.0912, currency: 'BGN' }, // 22:00 local
    { timestamp: 1651104000, price: 0.0867, currency: 'BGN' }, // 23:00 local
];

// Edge case test data
export const EMPTY_USAGE_DATA: UsageRecord[] = [];
export const EMPTY_PRICE_DATA: PriceRecord[] = [];

export const SINGLE_USAGE_DATA: UsageRecord[] = [
    { timestamp: 1651050000, kwh: 15.5 } // 08:00 local time
];

export const SINGLE_PRICE_DATA: PriceRecord[] = [
    { timestamp: 1651050000, price: 0.1289, currency: 'BGN' } // 08:00 local time
];

// High usage scenario (extreme peak)
export const HIGH_USAGE_DATA: UsageRecord[] = [
    { timestamp: 1651050000, kwh: 85.3 }, // 08:00 local - Very high usage
    { timestamp: 1651053600, kwh: 92.1 }, // 09:00 local
    { timestamp: 1651057200, kwh: 78.4 }, // 10:00 local
];

// Zero usage scenario
export const ZERO_USAGE_DATA: UsageRecord[] = [
    { timestamp: 1651050000, kwh: 0 }, // 08:00 local
    { timestamp: 1651053600, kwh: 0 }, // 09:00 local
    { timestamp: 1651057200, kwh: 0 }, // 10:00 local
];

// Invalid timestamp data
export const INVALID_TIMESTAMP_DATA: UsageRecord[] = [
    { timestamp: -1, kwh: 15.5 }, // Negative timestamp
    { timestamp: 0, kwh: 12.3 },  // Zero timestamp
];

// Real data sample from CSV (converted from milliseconds to seconds)
export const REAL_DATA_SAMPLE: UsageRecord[] = [
    { timestamp: 1651010400, kwh: 18.26 },
    { timestamp: 1649365200, kwh: 28.15 },
    { timestamp: 1650996000, kwh: 42.46 },
    { timestamp: 1649196000, kwh: 82.36 },
    { timestamp: 1650268800, kwh: 11.72 },
    { timestamp: 1650409200, kwh: 22.74 },
    { timestamp: 1650056400, kwh: 84.10 },
    { timestamp: 1650168000, kwh: 99.98 },
    { timestamp: 1650157200, kwh: 84.20 },
    { timestamp: 1649325600, kwh: 39.57 },
];

// Corresponding price data for real data sample
export const REAL_PRICE_SAMPLE: PriceRecord[] = [
    { timestamp: 1651010400, price: 0.0823, currency: 'BGN' },
    { timestamp: 1649365200, price: 0.0945, currency: 'BGN' },
    { timestamp: 1650996000, price: 0.1156, currency: 'BGN' },
    { timestamp: 1649196000, price: 0.1289, currency: 'BGN' },
    { timestamp: 1650268800, price: 0.0798, currency: 'BGN' },
    { timestamp: 1650409200, price: 0.0887, currency: 'BGN' },
    { timestamp: 1650056400, price: 0.0934, currency: 'BGN' },
    { timestamp: 1650168000, price: 0.1023, currency: 'BGN' },
    { timestamp: 1650157200, price: 0.1101, currency: 'BGN' },
    { timestamp: 1649325600, price: 0.0912, currency: 'BGN' },
];

// Test data with mismatched timestamps (usage without corresponding price)
export const MISMATCHED_USAGE_DATA: UsageRecord[] = [
    { timestamp: 1651021200, kwh: 15.5 }, // 00:00 local
    { timestamp: 1651024800, kwh: 12.3 }, // 01:00 local
    { timestamp: 1651028400, kwh: 18.7 }, // 02:00 local - No corresponding price
];

export const MISMATCHED_PRICE_DATA: PriceRecord[] = [
    { timestamp: 1651021200, price: 0.0823, currency: 'BGN' }, // 00:00 local
    { timestamp: 1651024800, price: 0.0798, currency: 'BGN' }, // 01:00 local
    { timestamp: 1651032000, price: 0.0756, currency: 'BGN' }, // 03:00 local - No corresponding usage
];

// Performance test data (larger dataset)
export const LARGE_USAGE_DATA: UsageRecord[] = Array.from({ length: 168 }, (_, i) => ({
    timestamp: 1651021200 + i * 3600, // 1 week of hourly data (starting from 00:00 local)
    kwh: Math.random() * 50 + 5, // Random usage between 5-55 kWh
}));

export const LARGE_PRICE_DATA: PriceRecord[] = Array.from({ length: 168 }, (_, i) => ({
    timestamp: 1651021200 + i * 3600, // 1 week of hourly data (starting from 00:00 local)
    price: Math.random() * 0.05 + 0.07, // Random price between 0.07-0.12 BGN
    currency: 'BGN',
}));

// Expected calculation results for validation
export const EXPECTED_RESULTS = {
    MOCK_DATA: {
        totalUsage: 263.7, // Sum of all usage values
        totalCost: 26.502, // Calculated total cost
        averagePrice: 0.09445416666666667, // Average of all prices
        peakUsageHour: 9, // Hour with highest usage (22.6 kWh) - UTC hour 9
        peakCostHour: 9, // Hour with highest cost (22.6 * 0.1289) - UTC hour 9
        maxUsage: 22.6,
        maxCost: 2.913, // 22.6 * 0.1289
        hour9Usage: 22.6, // Peak usage at UTC hour 9
        hour1Usage: 5.2, // Usage at UTC hour 1
        hour9Price: 0.1289, // Peak price at UTC hour 9
        hour1Price: 0.0823, // Price at UTC hour 1
    },
    REAL_DATA_SAMPLE: {
        totalUsage: 513.54, // Sum of real data sample (corrected)
        expectedMinCost: 40.0, // Rough minimum expected cost
        expectedMaxCost: 70.0, // Rough maximum expected cost
    },
}; 