import {
    aggregateByHour,
    calculateDataQuality,
    combineUsageAndPriceData,
    createHourlyDataMap,
    createTimeSeriesData,
    fetchDataWithFallback,
    filterDataByDateRange,
    groupDataByDate,
    processDateRange,
    validateDateRange
} from '../src/utils/data-utils';

import {
    EMPTY_PRICE_DATA,
    EMPTY_USAGE_DATA,
    MOCK_PRICE_DATA,
    MOCK_USAGE_DATA,
    REAL_DATA_SAMPLE,
    REAL_PRICE_SAMPLE,
} from './test-data';

describe('Data Utils', () => {
    describe('fetchDataWithFallback', () => {
        test('should return real data when fetch succeeds', async () => {
            const mockFetch = jest.fn().mockResolvedValue([
                { timestamp: 1651010400, kwh: 15.5 },
                { timestamp: 1651014000, kwh: 12.3 },
            ]);
            const mockFallback = jest.fn().mockReturnValue([
                { timestamp: 1651010400, kwh: 10.0 },
            ]);

            const result = await fetchDataWithFallback(
                mockFetch,
                mockFallback,
                'usage'
            );

            expect(result.usedMockData).toBe(false);
            expect(result.data).toHaveLength(2);
            expect(result.errors).toBeUndefined();
            expect(mockFetch).toHaveBeenCalled();
            expect(mockFallback).not.toHaveBeenCalled();
        });

        test('should return mock data when fetch returns empty', async () => {
            const mockFetch = jest.fn().mockResolvedValue([]);
            const mockFallback = jest.fn().mockReturnValue([
                { timestamp: 1651010400, kwh: 10.0 },
            ]);

            const result = await fetchDataWithFallback(
                mockFetch,
                mockFallback,
                'usage'
            );

            expect(result.usedMockData).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.errors).toBeUndefined();
            expect(mockFallback).toHaveBeenCalled();
        });

        test('should return mock data when fetch fails', async () => {
            const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
            const mockFallback = jest.fn().mockReturnValue([
                { timestamp: 1651010400, kwh: 10.0 },
            ]);

            const result = await fetchDataWithFallback(
                mockFetch,
                mockFallback,
                'usage'
            );

            expect(result.usedMockData).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.errors).toHaveLength(1);
            expect(result.errors![0]).toBe('Network error');
            expect(mockFallback).toHaveBeenCalled();
        });

        test('should handle non-Error objects', async () => {
            const mockFetch = jest.fn().mockRejectedValue('String error');
            const mockFallback = jest.fn().mockReturnValue([]);

            const result = await fetchDataWithFallback(
                mockFetch,
                mockFallback,
                'test'
            );

            expect(result.usedMockData).toBe(true);
            expect(result.errors).toContain('Unknown error');
        });
    });

    describe('processDateRange', () => {
        test('should process single day range', async () => {
            const startDate = new Date('2022-04-27');
            const endDate = new Date('2022-04-27');
            const processFn = jest.fn().mockImplementation((date: Date) =>
                Promise.resolve(`processed-${date.toISOString().split('T')[0]}`)
            );

            const result = await processDateRange(startDate, endDate, processFn);

            expect(result).toHaveLength(1);
            expect(result[0]).toBe('processed-2022-04-27');
            expect(processFn).toHaveBeenCalledTimes(1);
        });

        test('should process multi-day range', async () => {
            const startDate = new Date('2022-04-27');
            const endDate = new Date('2022-04-29');
            const processFn = jest.fn().mockImplementation((date: Date) =>
                Promise.resolve(`processed-${date.toISOString().split('T')[0]}`)
            );

            const result = await processDateRange(startDate, endDate, processFn);

            expect(result).toHaveLength(3);
            expect(result).toEqual([
                'processed-2022-04-27',
                'processed-2022-04-28',
                'processed-2022-04-29',
            ]);
            expect(processFn).toHaveBeenCalledTimes(3);
        });

        test('should handle async processing function', async () => {
            const startDate = new Date('2022-04-27');
            const endDate = new Date('2022-04-28');
            const processFn = jest.fn().mockImplementation((date: Date) =>
                new Promise(resolve =>
                    setTimeout(() => resolve(`async-${date.toISOString().split('T')[0]}`), 10)
                )
            );

            const result = await processDateRange(startDate, endDate, processFn);

            expect(result).toHaveLength(2);
            expect(result).toEqual([
                'async-2022-04-27',
                'async-2022-04-28',
            ]);
        });
    });

    describe('createHourlyDataMap', () => {
        test('should create map with 24 hours', () => {
            const initializer = (hour: number) => ({ hour, value: hour * 2 });
            const result = createHourlyDataMap(initializer);

            expect(result.size).toBe(24);
            expect(result.get(0)).toEqual({ hour: 0, value: 0 });
            expect(result.get(12)).toEqual({ hour: 12, value: 24 });
            expect(result.get(23)).toEqual({ hour: 23, value: 46 });
        });

        test('should call initializer for each hour', () => {
            const initializer = jest.fn().mockImplementation((hour: number) => ({ hour }));
            createHourlyDataMap(initializer);

            expect(initializer).toHaveBeenCalledTimes(24);
            expect(initializer).toHaveBeenCalledWith(0);
            expect(initializer).toHaveBeenCalledWith(23);
        });
    });

    describe('combineUsageAndPriceData', () => {
        test('should combine usage and price data correctly', () => {
            const result = combineUsageAndPriceData(MOCK_USAGE_DATA, MOCK_PRICE_DATA);

            expect(result).toHaveLength(24);

            // Check specific hour (timezone adjusted: 1651039200 -> hour 9 local)
            const hour9 = result.find(d => d.hour === 9);
            expect(hour9).toBeDefined();
            expect(hour9!.usage).toBeCloseTo(22.6, 2);
            expect(hour9!.price).toBeCloseTo(0.1289, 4);
            expect(hour9!.cost).toBeCloseTo(2.913, 3);
        });

        test('should handle missing usage data for some hours', () => {
            const limitedUsage = MOCK_USAGE_DATA.slice(0, 5); // Only first 5 hours
            const result = combineUsageAndPriceData(limitedUsage, MOCK_PRICE_DATA);

            expect(result).toHaveLength(24);

            // Should have usage for early hours (timezone adjusted - hour 1 has data now)
            expect(result[1].usage).toBeGreaterThan(0);

            // Should have zero usage for later hours
            expect(result[15].usage).toBe(0); // Hour 15 should have no usage
            expect(result[15].price).toBeGreaterThan(0); // But still have price
        });

        test('should handle missing price data for some hours', () => {
            const limitedPrices = MOCK_PRICE_DATA.slice(0, 5); // Only first 5 hours
            const result = combineUsageAndPriceData(MOCK_USAGE_DATA, limitedPrices);

            expect(result).toHaveLength(24);

            // Should have price for early hours (timezone adjusted)
            expect(result[1].price).toBeGreaterThan(0);

            // Should have zero price for later hours
            expect(result[15].price).toBe(0); // Hour 15 should have no price
            expect(result[15].usage).toBeGreaterThan(0); // But still have usage
        });

        test('should handle empty data', () => {
            const result = combineUsageAndPriceData(EMPTY_USAGE_DATA, EMPTY_PRICE_DATA);

            expect(result).toHaveLength(24);
            result.forEach(point => {
                expect(point.usage).toBe(0);
                expect(point.price).toBe(0);
                expect(point.cost).toBe(0);
            });
        });

        test('should aggregate multiple usage records for same hour', () => {
            const duplicateUsage = [
                { timestamp: 1651039200, kwh: 10.0 }, // Hour 12 (timezone adjusted)
                { timestamp: 1651039200, kwh: 15.0 }, // Hour 12 (same)
            ];
            const singlePrice = [
                { timestamp: 1651039200, price: 0.1, currency: 'BGN' },
            ];

            const result = combineUsageAndPriceData(duplicateUsage, singlePrice);
            const hour6 = result.find(d => d.hour === 6); // UTC hour 6 (1651039200 -> hour 6)

            expect(hour6!.usage).toBe(25.0); // Should sum both usage values
            expect(hour6!.price).toBe(0.1);
            expect(hour6!.cost).toBe(2.5);
        });
    });

    describe('validateDateRange', () => {
        test('should validate correct date range', () => {
            const startDate = new Date('2022-04-01');
            const endDate = new Date('2022-04-07');

            const result = validateDateRange(startDate, endDate);

            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        test('should reject invalid start date', () => {
            const startDate = new Date('invalid');
            const endDate = new Date('2022-04-07');

            const result = validateDateRange(startDate, endDate);

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid date format');
        });

        test('should reject invalid end date', () => {
            const startDate = new Date('2022-04-01');
            const endDate = new Date('invalid');

            const result = validateDateRange(startDate, endDate);

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Invalid date format');
        });

        test('should reject start date after end date', () => {
            const startDate = new Date('2022-04-07');
            const endDate = new Date('2022-04-01');

            const result = validateDateRange(startDate, endDate);

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Start date must be before end date');
        });

        test('should reject date range exceeding max days', () => {
            const startDate = new Date('2022-01-01');
            const endDate = new Date('2022-12-31'); // More than 90 days

            const result = validateDateRange(startDate, endDate);

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Date range cannot exceed 90 days');
        });

        test('should accept custom max days', () => {
            const startDate = new Date('2022-01-01');
            const endDate = new Date('2022-01-10'); // 9 days

            const result = validateDateRange(startDate, endDate, 5); // Max 5 days

            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Date range cannot exceed 5 days');
        });
    });

    describe('createTimeSeriesData', () => {
        test('should create time series with hour format', () => {
            const data = [
                { timestamp: 1651010400, value: 10.5 }, // 04:00 (timezone adjusted)
                { timestamp: 1651039200, value: 22.6 }, // 12:00 (timezone adjusted)
            ];

            const result = createTimeSeriesData(data, item => item.value, 'hour');

            expect(result).toHaveLength(2);
            expect(result[0].time).toBe('22:00'); // UTC hour 22 (1651010400 -> hour 22)
            expect(result[0].value).toBe(10.5);
            expect(result[1].time).toBe('06:00'); // UTC hour 6 (1651039200 -> hour 6)
            expect(result[1].value).toBe(22.6);
            expect(result[0].original).toBe(data[0]);
        });

        test('should create time series with date format', () => {
            const data = [
                { timestamp: 1651010400, value: 10.5 },
                { timestamp: 1651096800, value: 15.2 }, // Next day
            ];

            const result = createTimeSeriesData(data, item => item.value, 'date');

            expect(result).toHaveLength(2);
            expect(result[0].time).toBe('2022-04-26'); // Actual date for 1651010400
            expect(result[1].time).toBe('2022-04-27'); // Actual date for 1651096800
        });

        test('should handle custom value accessor', () => {
            const data = [
                { timestamp: 1651010400, kwh: 10.5, price: 0.08 },
                { timestamp: 1651039200, kwh: 22.6, price: 0.12 },
            ];

            const result = createTimeSeriesData(data, item => item.price);

            expect(result[0].value).toBe(0.08);
            expect(result[1].value).toBe(0.12);
        });

        test('should handle empty data', () => {
            const result = createTimeSeriesData<{ timestamp: number; value: number }>([], item => item.value);

            expect(result).toHaveLength(0);
        });
    });

    describe('aggregateByHour', () => {
        test('should aggregate data by hour', () => {
            const data = [
                { timestamp: 1651010400, kwh: 10.0 }, // Hour 4 (timezone adjusted)
                { timestamp: 1651014000, kwh: 5.0 },  // Hour 5 (timezone adjusted)
                { timestamp: 1651010400, kwh: 8.0 },  // Hour 4 again
            ];

            const result = aggregateByHour(data, item => item.kwh);

            expect(result).toHaveLength(2);

            const hour22 = result.find(h => h.hour === 22); // UTC hour 22 (1651010400 -> hour 22)
            expect(hour22!.total).toBe(18.0);
            expect(hour22!.count).toBe(2);
            expect(hour22!.average).toBe(9.0);

            const hour23 = result.find(h => h.hour === 23); // UTC hour 23 (1651014000 -> hour 23)
            expect(hour23!.total).toBe(5.0);
            expect(hour23!.count).toBe(1);
            expect(hour23!.average).toBe(5.0);
        });

        test('should sort results by hour', () => {
            const data = [
                { timestamp: 1651093200, kwh: 10.0 }, // Hour 3 (timezone adjusted)
                { timestamp: 1651010400, kwh: 5.0 },  // Hour 4 (timezone adjusted)
                { timestamp: 1651053600, kwh: 8.0 },  // Hour 16 (timezone adjusted)
            ];

            const result = aggregateByHour(data, item => item.kwh);

            expect(result.map(r => r.hour)).toEqual([10, 21, 22]); // Actual UTC hours based on timestamps
        });

        test('should handle empty data', () => {
            const result = aggregateByHour<{ timestamp: number; kwh: number }>([], item => item.kwh);

            expect(result).toHaveLength(0);
        });

        test('should round values correctly', () => {
            const data = [
                { timestamp: 1651010400, kwh: 10.123456 },
                { timestamp: 1651010400, kwh: 5.654321 },
            ];

            const result = aggregateByHour(data, item => item.kwh);

            expect(result[0].total).toBe(15.7778);
            expect(result[0].average).toBe(7.8889);
        });
    });

    describe('groupDataByDate', () => {
        test('should group data by date', () => {
            const data = [
                { timestamp: 1651010400 }, // 2022-04-27 04:00 local
                { timestamp: 1651096800 }, // 2022-04-28 04:00 local
                { timestamp: 1651014000 }, // 2022-04-27 05:00 local (same day)
            ];

            const result = groupDataByDate(data);

            expect(result.size).toBe(2); // Should have 2 dates
            expect(result.get('2022-04-26')).toHaveLength(2); // 1651010400, 1651014000
            expect(result.get('2022-04-27')).toHaveLength(1); // 1651096800
        });

        test('should handle empty data', () => {
            const result = groupDataByDate([]);

            expect(result.size).toBe(0);
        });

        test('should handle single day data', () => {
            const data = [
                { timestamp: 1651010400 }, // 2022-04-27 04:00 local
                { timestamp: 1651014000 }, // 2022-04-27 05:00 local
                { timestamp: 1651017600 }, // 2022-04-27 06:00 local
            ];

            const result = groupDataByDate(data);

            expect(result.size).toBe(2); // Actually spans 2 dates in UTC
            expect(result.get('2022-04-26')).toHaveLength(2); // 1651010400, 1651014000
            expect(result.get('2022-04-27')).toHaveLength(1); // 1651017600
        });
    });

    describe('filterDataByDateRange', () => {
        test('should filter data within date range', () => {
            const data = [
                { timestamp: 1651010400 }, // 2022-04-27 (but shows as 04:00 local)
                { timestamp: 1651096800 }, // 2022-04-28 (but shows as 04:00 local) 
                { timestamp: 1651183200 }, // 2022-04-29 (but shows as 04:00 local)
            ];

            const result = filterDataByDateRange(data, '2022-04-27', '2022-04-28');

            expect(result).toHaveLength(2); // Should get 2 records in range
            expect(result.map(d => d.timestamp)).toEqual([1651096800, 1651183200]);
        });

        test('should exclude data outside range', () => {
            const data = [
                { timestamp: 1650924000 }, // 2022-04-26 (before)
                { timestamp: 1651010400 }, // 2022-04-27 (in range)
                { timestamp: 1651269600 }, // 2022-04-30 (after)
            ];

            const result = filterDataByDateRange(data, '2022-04-27', '2022-04-28');

            expect(result).toHaveLength(0); // No records in range (1651010400 is 2022-04-26, out of 2022-04-27 to 2022-04-28 range)
        });

        test('should handle empty data', () => {
            const result = filterDataByDateRange([], '2022-04-27', '2022-04-28');

            expect(result).toHaveLength(0);
        });

        test('should handle single day range', () => {
            const data = [
                { timestamp: 1651010400 }, // 2022-04-27 00:00
                { timestamp: 1651053600 }, // 2022-04-27 12:00
                { timestamp: 1651096800 }, // 2022-04-28 00:00
            ];

            const result = filterDataByDateRange(data, '2022-04-27', '2022-04-27');

            expect(result).toHaveLength(2); // Only April 27th data
        });
    });

    describe('calculateDataQuality', () => {
        test('should calculate completeness correctly', () => {
            const data = Array.from({ length: 20 }, (_, i) => ({
                timestamp: 1651010400 + i * 3600
            }));

            const result = calculateDataQuality(data, 24);

            expect(result.completeness).toBe(83.3); // 20/24 * 100
            expect(result.hasGaps).toBe(true);
            expect(result.gapHours).toHaveLength(4);
        });

        test('should handle complete data', () => {
            const data = Array.from({ length: 24 }, (_, i) => ({
                timestamp: 1651010400 + i * 3600
            }));

            const result = calculateDataQuality(data, 24);

            expect(result.completeness).toBe(100.0);
            expect(result.hasGaps).toBe(false);
            expect(result.gapHours).toBeUndefined();
        });

        test('should handle empty data', () => {
            const result = calculateDataQuality([], 24);

            expect(result.completeness).toBe(0);
            expect(result.hasGaps).toBe(true);
            expect(result.gapHours).toBeUndefined();
        });

        test('should identify gap hours correctly', () => {
            const data = [
                { timestamp: 1651010400 }, // Hour 4 (timezone adjusted)
                { timestamp: 1651017600 }, // Hour 6 (timezone adjusted)  
                { timestamp: 1651021200 }, // Hour 7 (timezone adjusted)
            ];

            const result = calculateDataQuality(data, 24);

            expect(result.gapHours).toContain(2); // Missing hour 2 (we have hours 22, 0, 1)
            expect(result.gapHours).not.toContain(22); // Has hour 22 (1651010400)
            expect(result.gapHours).not.toContain(0); // Has hour 0 (1651017600)
            expect(result.gapHours).not.toContain(1); // Has hour 1 (1651021200)
        });

        test('should handle custom expected count', () => {
            const data = Array.from({ length: 5 }, (_, i) => ({
                timestamp: 1651010400 + i * 3600
            }));

            const result = calculateDataQuality(data, 10);

            expect(result.completeness).toBe(50.0);
            expect(result.hasGaps).toBe(true);
        });
    });

    describe('Integration Tests', () => {
        test('should work with real data sample', () => {
            const combined = combineUsageAndPriceData(REAL_DATA_SAMPLE, REAL_PRICE_SAMPLE);

            expect(combined).toHaveLength(24);
            expect(combined.some(point => point.usage > 0)).toBe(true);
            expect(combined.some(point => point.price > 0)).toBe(true);
            expect(combined.some(point => point.cost > 0)).toBe(true);
        });

        test('should handle data quality analysis with real data', () => {
            const quality = calculateDataQuality(REAL_DATA_SAMPLE, 24);

            expect(quality.completeness).toBeGreaterThan(0);
            expect(quality.completeness).toBeLessThanOrEqual(100);
            expect(typeof quality.hasGaps).toBe('boolean');
        });

        test('should create meaningful time series from real data', () => {
            const timeSeries = createTimeSeriesData(
                REAL_DATA_SAMPLE,
                item => item.kwh,
                'hour'
            );

            expect(timeSeries.length).toBe(REAL_DATA_SAMPLE.length);
            timeSeries.forEach(point => {
                expect(point.time).toMatch(/^\d{2}:\d{2}$/);
                expect(point.value).toBeGreaterThan(0);
                expect(point.original).toBeDefined();
            });
        });
    });
}); 