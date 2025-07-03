import * as fs from 'fs';
import * as path from 'path';
import {
    calculateAveragePrice,
    calculateTotalUsage,
    performCompleteElectricityAnalysis,
} from '../src/utils/electricity-calculations';

import { PriceRecord, UsageRecord } from '../src/types';

describe('Live Data Validation', () => {
    let realUsageData: UsageRecord[] = [];
    let realPriceData: PriceRecord[] = [];

    beforeAll(() => {
        // Load real data from CSV file if available
        try {
            const csvPath = path.join(__dirname, '../tasks/data.csv');
            if (fs.existsSync(csvPath)) {
                const csvContent = fs.readFileSync(csvPath, 'utf-8');
                const lines = csvContent.split('\n').filter(line => line.trim());

                // Parse CSV: meteringPointId,timestamp,value
                // Convert to our format (timestamp in seconds, not milliseconds)
                realUsageData = lines.slice(0, 100).map(line => {
                    const [meteringPointId, timestamp, value] = line.split(',');
                    return {
                        timestamp: Math.floor(parseInt(timestamp) / 1000), // Convert ms to seconds
                        kwh: parseFloat(value),
                    };
                }).filter(record => !isNaN(record.timestamp) && !isNaN(record.kwh));

                // Create corresponding price data (realistic Bulgarian electricity prices)
                realPriceData = realUsageData.map(usage => ({
                    timestamp: usage.timestamp,
                    price: 0.08 + Math.random() * 0.04, // Random price between 0.08-0.12 BGN/kWh
                    currency: 'BGN' as const,
                }));
            }
        } catch (error) {
            console.warn('Could not load real data from CSV:', error);
        }
    });

    test('should validate calculations with real CSV data', () => {
        if (realUsageData.length === 0) {
            console.log('No real data available, skipping test');
            return;
        }

        const totalUsage = calculateTotalUsage(realUsageData);
        const averagePrice = calculateAveragePrice(realPriceData);

        expect(totalUsage).toBeGreaterThan(0);
        expect(averagePrice).toBeGreaterThan(0);
        expect(averagePrice).toBeLessThan(1); // Reasonable price range

        console.log(`Real data test results:
      - Records processed: ${realUsageData.length}
      - Total usage: ${totalUsage.toFixed(2)} kWh
      - Average price: ${averagePrice.toFixed(4)} BGN/kWh
      - Total cost: ${(totalUsage * averagePrice).toFixed(2)} BGN`);
    });

    test('should perform complete analysis with real data', () => {
        if (realUsageData.length === 0) {
            console.log('No real data available, skipping test');
            return;
        }

        const analysis = performCompleteElectricityAnalysis(realUsageData, realPriceData);

        expect(analysis.totalKwh).toBeGreaterThan(0);
        expect(analysis.totalCost).toBeGreaterThan(0);
        expect(analysis.averagePrice).toBeGreaterThan(0);
        expect(analysis.hourlyData).toHaveLength(24);
        expect(analysis.efficiencyScore).toBeGreaterThanOrEqual(0);
        expect(analysis.efficiencyScore).toBeLessThanOrEqual(100);

        // Validate peak analysis makes sense
        expect(analysis.peakAnalysis.peakUsageHour).toBeGreaterThanOrEqual(0);
        expect(analysis.peakAnalysis.peakUsageHour).toBeLessThan(24);
        expect(analysis.peakAnalysis.maxUsage).toBeGreaterThanOrEqual(0);

        console.log(`Real data analysis results:
      - Peak usage hour: ${analysis.peakAnalysis.peakUsageHour}:00
      - Max usage: ${analysis.peakAnalysis.maxUsage.toFixed(2)} kWh
      - Efficiency score: ${analysis.efficiencyScore.toFixed(1)}%
      - Price thresholds: Low=${analysis.priceThresholds.low.toFixed(4)}, High=${analysis.priceThresholds.high.toFixed(4)} BGN`);
    });

    test('should validate data consistency with real CSV data', () => {
        if (realUsageData.length === 0) {
            console.log('No real data available, skipping test');
            return;
        }

        // Validate data format
        realUsageData.forEach((record, index) => {
            expect(record.timestamp).toBeGreaterThan(0);
            expect(record.kwh).toBeGreaterThanOrEqual(0);
            expect(typeof record.timestamp).toBe('number');
            expect(typeof record.kwh).toBe('number');
        });

        // Validate timestamps are in reasonable range (2022 data)
        const timestamps = realUsageData.map(r => r.timestamp);
        const minTimestamp = Math.min(...timestamps);
        const maxTimestamp = Math.max(...timestamps);

        // Should be 2022 data (between Jan 1, 2022 and Dec 31, 2022)
        expect(minTimestamp).toBeGreaterThan(1640995200); // 2022-01-01
        expect(maxTimestamp).toBeLessThan(1672531200);    // 2023-01-01

        console.log(`Data consistency check passed:
      - Date range: ${new Date(minTimestamp * 1000).toISOString().split('T')[0]} to ${new Date(maxTimestamp * 1000).toISOString().split('T')[0]}
      - Usage range: ${Math.min(...realUsageData.map(r => r.kwh)).toFixed(2)} - ${Math.max(...realUsageData.map(r => r.kwh)).toFixed(2)} kWh`);
    });

    test('should handle edge cases in real data', () => {
        if (realUsageData.length === 0) {
            console.log('No real data available, skipping test');
            return;
        }

        // Test with minimal data
        const minimalData = realUsageData.slice(0, 1);
        const minimalPrices = realPriceData.slice(0, 1);

        const result = performCompleteElectricityAnalysis(minimalData, minimalPrices);
        expect(result).toBeDefined();
        expect(result.totalKwh).toBe(minimalData[0].kwh);

        // Test with zero usage record if it exists
        const zeroUsageData = realUsageData.filter(r => r.kwh === 0);
        if (zeroUsageData.length > 0) {
            const zeroTotal = calculateTotalUsage(zeroUsageData);
            expect(zeroTotal).toBe(0);
        }

        console.log(`Edge case testing completed:
      - Minimal data test: passed
      - Zero usage records found: ${zeroUsageData.length}`);
    });
}); 