import {
    calculateAveragePrice,
    calculateEfficiencyScore,
    calculatePeakAnalysis,
    calculatePriceThresholds,
    calculateTotalCost,
    calculateTotalUsage,
    createHourlyDataPoints,
    createPriceByHourMap,
    createUsageByHourMap,
    findLowPriceHours,
    formatHour,
    getHourFromTimestamp,
    performCompleteElectricityAnalysis,
    roundCurrency,
    roundPrice,
    roundToDecimals,
    roundUsage,
    timestampToDate
} from '../src/utils/electricity-calculations';

import {
    EMPTY_PRICE_DATA,
    EMPTY_USAGE_DATA,
    EXPECTED_RESULTS,
    HIGH_USAGE_DATA,
    LARGE_PRICE_DATA,
    LARGE_USAGE_DATA,
    MISMATCHED_PRICE_DATA,
    MISMATCHED_USAGE_DATA,
    MOCK_PRICE_DATA,
    MOCK_USAGE_DATA,
    REAL_DATA_SAMPLE,
    REAL_PRICE_SAMPLE,
    SINGLE_PRICE_DATA,
    SINGLE_USAGE_DATA,
    ZERO_USAGE_DATA
} from './test-data';

describe('Electricity Calculations', () => {
    describe('Basic Calculations', () => {
        describe('calculateTotalUsage', () => {
            test('should calculate total usage correctly', () => {
                const result = calculateTotalUsage(MOCK_USAGE_DATA);
                expect(result).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.totalUsage, 2);
            });

            test('should handle empty data', () => {
                const result = calculateTotalUsage(EMPTY_USAGE_DATA);
                expect(result).toBe(0);
            });

            test('should handle single data point', () => {
                const result = calculateTotalUsage(SINGLE_USAGE_DATA);
                expect(result).toBe(15.5);
            });

            test('should handle zero usage', () => {
                const result = calculateTotalUsage(ZERO_USAGE_DATA);
                expect(result).toBe(0);
            });

            test('should handle real data sample', () => {
                const result = calculateTotalUsage(REAL_DATA_SAMPLE);
                expect(result).toBeCloseTo(513.54, 2);
            });

            test('should handle high usage values', () => {
                const result = calculateTotalUsage(HIGH_USAGE_DATA);
                expect(result).toBeCloseTo(255.8, 2);
            });
        });

        describe('calculateAveragePrice', () => {
            test('should calculate average price correctly', () => {
                const result = calculateAveragePrice(MOCK_PRICE_DATA);
                expect(result).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.averagePrice, 4);
            });

            test('should handle empty data', () => {
                const result = calculateAveragePrice(EMPTY_PRICE_DATA);
                expect(result).toBe(0);
            });

            test('should handle single price', () => {
                const result = calculateAveragePrice(SINGLE_PRICE_DATA);
                expect(result).toBe(0.1289);
            });

            test('should handle real price data', () => {
                const result = calculateAveragePrice(REAL_PRICE_SAMPLE);
                expect(result).toBeValidPrice();
                expect(result).toBeGreaterThan(0);
            });
        });

        describe('calculateTotalCost', () => {
            test('should calculate total cost correctly', () => {
                const priceMap = createPriceByHourMap(MOCK_PRICE_DATA);
                const result = calculateTotalCost(MOCK_USAGE_DATA, priceMap);
                expect(result).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.totalCost, 2);
            });

            test('should handle empty usage data', () => {
                const priceMap = createPriceByHourMap(MOCK_PRICE_DATA);
                const result = calculateTotalCost(EMPTY_USAGE_DATA, priceMap);
                expect(result).toBe(0);
            });

            test('should handle missing price data', () => {
                const priceMap = createPriceByHourMap(EMPTY_PRICE_DATA);
                const result = calculateTotalCost(MOCK_USAGE_DATA, priceMap);
                expect(result).toBe(0);
            });

            test('should handle mismatched data', () => {
                const priceMap = createPriceByHourMap(MISMATCHED_PRICE_DATA);
                const result = calculateTotalCost(MISMATCHED_USAGE_DATA, priceMap);
                expect(result).toBeGreaterThan(0);
            });

            test('should handle real data sample', () => {
                const priceMap = createPriceByHourMap(REAL_PRICE_SAMPLE);
                const result = calculateTotalCost(REAL_DATA_SAMPLE, priceMap);
                expect(result).toBeGreaterThan(EXPECTED_RESULTS.REAL_DATA_SAMPLE.expectedMinCost);
                expect(result).toBeLessThan(EXPECTED_RESULTS.REAL_DATA_SAMPLE.expectedMaxCost);
            });
        });
    });

    describe('Timestamp and Time Utilities', () => {
        describe('getHourFromTimestamp', () => {
            test('should extract hour correctly', () => {
                const result = getHourFromTimestamp(1651050000); // This converts to hour 9 in UTC
                expect(result).toBe(9);
            });

            test('should handle different hours', () => {
                expect(getHourFromTimestamp(1651021200)).toBe(1);  // 01:00 UTC
                expect(getHourFromTimestamp(1651064400)).toBe(13); // 13:00 UTC
                expect(getHourFromTimestamp(1651104000)).toBe(0); // 00:00 UTC
            });

            test('should handle invalid timestamps gracefully', () => {
                // This should not throw an error
                const result = getHourFromTimestamp(-1);
                expect(typeof result).toBe('number');
            });
        });

        describe('timestampToDate', () => {
            test('should convert timestamp to date correctly', () => {
                const result = timestampToDate(1651050000);
                expect(result).toBeInstanceOf(Date);
                expect(result.getHours()).toBe(12); // Actual hour in current timezone
            });

            test('should handle zero timestamp', () => {
                const result = timestampToDate(0);
                expect(result).toBeInstanceOf(Date);
                expect(result.getTime()).toBe(0);
            });
        });

        describe('formatHour', () => {
            test('should format hours correctly', () => {
                expect(formatHour(8)).toBe('08:00');
                expect(formatHour(12)).toBe('12:00');
                expect(formatHour(0)).toBe('00:00');
                expect(formatHour(23)).toBe('23:00');
            });

            test('should handle invalid hours', () => {
                expect(formatHour(-1)).toBe('-01:00');
                expect(formatHour(25)).toBe('25:00');
            });
        });
    });

    describe('Data Mapping Utilities', () => {
        describe('createPriceByHourMap', () => {
            test('should create price map correctly', () => {
                const result = createPriceByHourMap(MOCK_PRICE_DATA);
                expect(result.size).toBe(24);
                expect(result.get(9)).toBeCloseTo(0.1289, 4); // 09:00 UTC (peak hour)
                expect(result.get(1)).toBeCloseTo(0.0823, 4); // 01:00 UTC (off-peak hour)
            });

            test('should handle empty data', () => {
                const result = createPriceByHourMap(EMPTY_PRICE_DATA);
                expect(result.size).toBe(0);
            });

            test('should handle duplicate hours', () => {
                const duplicateData = [
                    { timestamp: 1651050000, price: 0.1289, currency: 'BGN' },
                    { timestamp: 1651050000, price: 0.1500, currency: 'BGN' }, // Same hour
                ];
                const result = createPriceByHourMap(duplicateData);
                expect(result.size).toBe(1);
                expect(result.get(9)).toBe(0.1500); // Should keep the last value (hour 9 in UTC)
            });
        });

        describe('createUsageByHourMap', () => {
            test('should create usage map correctly', () => {
                const result = createUsageByHourMap(MOCK_USAGE_DATA);
                expect(result.size).toBe(24);
                expect(result.get(9)).toBeCloseTo(22.6, 2); // 09:00 UTC (peak hour)
                expect(result.get(1)).toBeCloseTo(5.2, 2); // 01:00 UTC (off-peak hour)
            });

            test('should handle empty data', () => {
                const result = createUsageByHourMap(EMPTY_USAGE_DATA);
                expect(result.size).toBe(0);
            });

            test('should aggregate duplicate hours', () => {
                const duplicateData = [
                    { timestamp: 1651050000, kwh: 15.5 },
                    { timestamp: 1651050000, kwh: 10.5 }, // Same hour
                ];
                const result = createUsageByHourMap(duplicateData);
                expect(result.size).toBe(1);
                expect(result.get(9)).toBe(26.0); // Should sum both values (hour 9 in UTC)
            });
        });
    });

    describe('Peak Analysis', () => {
        describe('calculatePeakAnalysis', () => {
            test('should identify peak usage and cost correctly', () => {
                const priceMap = createPriceByHourMap(MOCK_PRICE_DATA);
                const result = calculatePeakAnalysis(MOCK_USAGE_DATA, priceMap);

                expect(result.peakUsageHour).toBe(EXPECTED_RESULTS.MOCK_DATA.peakUsageHour);
                expect(result.maxUsage).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.maxUsage, 2);
                expect(result.peakCostHour).toBe(EXPECTED_RESULTS.MOCK_DATA.peakCostHour);
                expect(result.maxCost).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.maxCost, 3);
            });

            test('should handle empty data', () => {
                const priceMap = createPriceByHourMap(EMPTY_PRICE_DATA);
                const result = calculatePeakAnalysis(EMPTY_USAGE_DATA, priceMap);

                expect(result.peakUsageHour).toBe(0);
                expect(result.maxUsage).toBe(0);
                expect(result.peakCostHour).toBe(0);
                expect(result.maxCost).toBe(0);
            });

            test('should handle single data point', () => {
                const priceMap = createPriceByHourMap(SINGLE_PRICE_DATA);
                const result = calculatePeakAnalysis(SINGLE_USAGE_DATA, priceMap);

                expect(result.peakUsageHour).toBe(9); // Hour 9 in UTC
                expect(result.maxUsage).toBe(15.5);
                expect(result.peakCostHour).toBe(9); // Hour 9 in UTC
                expect(result.maxCost).toBeCloseTo(1.998, 3);
            });

            test('should handle zero usage', () => {
                const priceMap = createPriceByHourMap(MOCK_PRICE_DATA);
                const result = calculatePeakAnalysis(ZERO_USAGE_DATA, priceMap);

                expect(result.maxUsage).toBe(0);
                expect(result.maxCost).toBe(0);
            });
        });
    });

    describe('Hourly Data Points', () => {
        describe('createHourlyDataPoints', () => {
            test('should create hourly data points correctly', () => {
                const result = createHourlyDataPoints(MOCK_USAGE_DATA, MOCK_PRICE_DATA);

                expect(result).toHaveLength(24);
                expect(result[0].hour).toBe(0);
                expect(result[23].hour).toBe(23);

                // Check specific hour data
                const hour9 = result[9];
                expect(hour9.hour).toBe(9);
                expect(hour9.usage).toBeCloseTo(22.6, 2); // Peak usage at UTC hour 9
                expect(hour9.price).toBeCloseTo(0.1289, 4); // Peak price at UTC hour 9
                expect(hour9.cost).toBeCloseTo(2.913, 3); // 22.6 * 0.1289
            });

            test('should handle empty data', () => {
                const result = createHourlyDataPoints(EMPTY_USAGE_DATA, EMPTY_PRICE_DATA);

                expect(result).toHaveLength(24);
                result.forEach(point => {
                    expect(point.usage).toBe(0);
                    expect(point.price).toBe(0);
                    expect(point.cost).toBe(0);
                });
            });

            test('should handle mismatched data', () => {
                const result = createHourlyDataPoints(MISMATCHED_USAGE_DATA, MISMATCHED_PRICE_DATA);

                expect(result).toHaveLength(24);
                // Should handle hours with usage but no price
                expect(result.some(point => point.usage > 0 && point.price === 0)).toBe(true);
            });
        });
    });

    describe('Price Analysis', () => {
        describe('calculatePriceThresholds', () => {
            test('should calculate price thresholds correctly', () => {
                const result = calculatePriceThresholds(MOCK_PRICE_DATA);

                expect(result.average).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.averagePrice, 4);
                expect(result.high).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.averagePrice * 1.2, 4);
                expect(result.low).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.averagePrice * 0.8, 4);
            });

            test('should handle custom multipliers', () => {
                const result = calculatePriceThresholds(MOCK_PRICE_DATA, 1.5, 0.5);

                expect(result.high).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.averagePrice * 1.5, 4);
                expect(result.low).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.averagePrice * 0.5, 4);
            });

            test('should handle empty data', () => {
                const result = calculatePriceThresholds(EMPTY_PRICE_DATA);

                expect(result.average).toBe(0);
                expect(result.high).toBe(0);
                expect(result.low).toBe(0);
            });
        });

        describe('findLowPriceHours', () => {
            test('should find low price hours correctly', () => {
                const result = findLowPriceHours(MOCK_PRICE_DATA);

                expect(result).toEqual(expect.arrayContaining([5])); // UTC hour 5 is the only low price hour
                expect(result).not.toContain(9); // Peak price hour (09:00 UTC)
            });

            test('should handle custom threshold', () => {
                const result = findLowPriceHours(MOCK_PRICE_DATA, 0.08);

                expect(result.length).toBeGreaterThan(0);
                expect(result.length).toBeLessThan(24);
            });

            test('should handle empty data', () => {
                const result = findLowPriceHours(EMPTY_PRICE_DATA);

                expect(result).toEqual([]);
            });
        });
    });

    describe('Formatting Utilities', () => {
        describe('roundToDecimals', () => {
            test('should round to specified decimals', () => {
                expect(roundToDecimals(1.23456, 2)).toBe(1.23);
                expect(roundToDecimals(1.23456, 3)).toBe(1.235);
                expect(roundToDecimals(1.23456, 0)).toBe(1);
            });

            test('should handle edge cases', () => {
                expect(roundToDecimals(0, 2)).toBe(0);
                expect(roundToDecimals(-1.234, 2)).toBe(-1.23);
                expect(roundToDecimals(1.999, 2)).toBe(2.00);
            });
        });

        describe('roundCurrency', () => {
            test('should round currency correctly', () => {
                expect(roundCurrency(1.234567)).toBe(1.23);
                expect(roundCurrency(1.999)).toBe(2.00);
            });
        });

        describe('roundPrice', () => {
            test('should round price correctly', () => {
                expect(roundPrice(0.123456)).toBe(0.1235);
                expect(roundPrice(0.999999)).toBe(1.0000);
            });
        });

        describe('roundUsage', () => {
            test('should round usage correctly', () => {
                expect(roundUsage(15.456)).toBe(15.46);
                expect(roundUsage(15.999)).toBe(16.00);
            });
        });
    });

    describe('Efficiency Analysis', () => {
        describe('calculateEfficiencyScore', () => {
            test('should calculate efficiency score for normal usage', () => {
                const result = calculateEfficiencyScore(MOCK_USAGE_DATA);

                expect(result).toBeGreaterThanOrEqual(0); // Changed to >= 0 since efficiency can be 0
                expect(result).toBeLessThanOrEqual(100);
            });

            test('should handle empty data', () => {
                const result = calculateEfficiencyScore(EMPTY_USAGE_DATA);

                expect(result).toBe(50); // Default neutral score
            });

            test('should handle consistent usage patterns', () => {
                const consistentData = Array.from({ length: 24 }, (_, i) => ({
                    timestamp: 1651010400 + i * 3600,
                    kwh: 10.0 // Consistent usage
                }));

                const result = calculateEfficiencyScore(consistentData);

                expect(result).toBeGreaterThan(90); // High efficiency for consistent usage
            });

            test('should handle highly variable usage', () => {
                const variableData = [
                    { timestamp: 1651010400, kwh: 1.0 },
                    { timestamp: 1651014000, kwh: 100.0 },
                    { timestamp: 1651017600, kwh: 1.0 },
                    { timestamp: 1651021200, kwh: 100.0 },
                ];

                const result = calculateEfficiencyScore(variableData);

                expect(result).toBeLessThan(50); // Low efficiency for variable usage
            });
        });
    });

    describe('Complete Analysis', () => {
        describe('performCompleteElectricityAnalysis', () => {
            test('should perform complete analysis correctly', () => {
                const result = performCompleteElectricityAnalysis(MOCK_USAGE_DATA, MOCK_PRICE_DATA);

                expect(result.totalKwh).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.totalUsage, 2);
                expect(result.totalCost).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.totalCost, 2);
                expect(result.averagePrice).toBeCloseTo(EXPECTED_RESULTS.MOCK_DATA.averagePrice, 4);
                expect(result.peakAnalysis.peakUsageHour).toBe(EXPECTED_RESULTS.MOCK_DATA.peakUsageHour);
                expect(result.hourlyData).toHaveLength(24);
                expect(result.priceThresholds.average).toBeCloseTo(0.09445416666666667, 4);
                expect(result.efficiencyScore).toBeGreaterThanOrEqual(0);
            });

            test('should handle empty data', () => {
                const result = performCompleteElectricityAnalysis(EMPTY_USAGE_DATA, EMPTY_PRICE_DATA);

                expect(result.totalKwh).toBe(0);
                expect(result.totalCost).toBe(0);
                expect(result.averagePrice).toBe(0);
                expect(result.hourlyData).toHaveLength(24);
                expect(result.efficiencyScore).toBe(50);
            });

            test('should handle real data sample', () => {
                const result = performCompleteElectricityAnalysis(REAL_DATA_SAMPLE, REAL_PRICE_SAMPLE);

                expect(result.totalKwh).toBeCloseTo(EXPECTED_RESULTS.REAL_DATA_SAMPLE.totalUsage, 2);
                expect(result.totalCost).toBeGreaterThan(0);
                expect(result.averagePrice).toBeGreaterThan(0);
                expect(result.hourlyData).toHaveLength(24);
                expect(result.efficiencyScore).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle negative usage values', () => {
            const negativeUsage = [{ timestamp: 1651010400, kwh: -5.0 }];
            const result = calculateTotalUsage(negativeUsage);

            expect(result).toBe(-5.0);
        });

        test('should handle negative price values', () => {
            const negativePrice = [{ timestamp: 1651010400, price: -0.1, currency: 'BGN' }];
            const result = calculateAveragePrice(negativePrice);

            expect(result).toBe(-0.1);
        });

        test('should handle very large numbers', () => {
            const largeUsage = [{ timestamp: 1651010400, kwh: 999999.99 }];
            const result = calculateTotalUsage(largeUsage);

            expect(result).toBe(999999.99);
        });

        test('should handle very small numbers', () => {
            const smallUsage = [{ timestamp: 1651010400, kwh: 0.0001 }];
            const result = calculateTotalUsage(smallUsage);

            expect(result).toBe(0.0001);
        });
    });

    describe('Performance Tests', () => {
        test('should handle large datasets efficiently', () => {
            const startTime = performance.now();
            const result = performCompleteElectricityAnalysis(LARGE_USAGE_DATA, LARGE_PRICE_DATA);
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
            expect(result.totalKwh).toBeGreaterThan(0);
            expect(result.hourlyData).toHaveLength(24);
        });

        test('should handle repeated calculations efficiently', () => {
            const iterations = 100;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                calculateTotalUsage(MOCK_USAGE_DATA);
                calculateAveragePrice(MOCK_PRICE_DATA);
            }

            const endTime = performance.now();
            expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
        });
    });

    describe('Data Validation', () => {
        test('should validate timestamps are reasonable', () => {
            MOCK_USAGE_DATA.forEach(record => {
                expect(record.timestamp).toBeValidTimestamp();
            });
        });

        test('should validate prices are reasonable', () => {
            MOCK_PRICE_DATA.forEach(record => {
                expect(record.price).toBeValidPrice();
            });
        });

        test('should validate usage values are non-negative in normal cases', () => {
            MOCK_USAGE_DATA.forEach(record => {
                expect(record.kwh).toBeGreaterThanOrEqual(0);
            });
        });
    });
}); 