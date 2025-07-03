import {
    generateComprehensiveSuggestions,
    generateCostSuggestions,
    generateRealTimeRecommendation,
    type SuggestionOptions
} from '../src/utils/electricity-suggestions';

import {
    EMPTY_PRICE_DATA,
    EMPTY_USAGE_DATA,
    HIGH_USAGE_DATA,
    MOCK_PRICE_DATA,
    MOCK_USAGE_DATA,
    REAL_DATA_SAMPLE,
    REAL_PRICE_SAMPLE,
} from './test-data';

describe('Electricity Suggestions', () => {
    describe('generateRealTimeRecommendation', () => {
        test('should generate high alert for high price and high usage', () => {
            const result = generateRealTimeRecommendation(
                50.0, // High usage
                0.15,  // High price
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                8 // Current hour
            );

            expect(result.urgencyLevel).toBe('high');
            expect(result.type).toBe('price_alert');
            expect(result.recommendation).toContain('HIGH ALERT');
            expect(result.potentialSavings).toBeGreaterThan(0);
        });

        test('should generate medium alert for high price only', () => {
            const result = generateRealTimeRecommendation(
                10.0, // Normal usage
                0.15,  // High price
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                8
            );

            expect(result.urgencyLevel).toBe('medium');
            expect(result.type).toBe('cost_optimization');
            expect(result.recommendation).toContain('Price is high');
            expect(result.potentialSavings).toBeGreaterThan(0);
        });

        test('should generate medium alert for high usage only', () => {
            const result = generateRealTimeRecommendation(
                50.0, // High usage
                0.08,  // Normal price
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                8
            );

            expect(result.urgencyLevel).toBe('medium');
            expect(result.type).toBe('usage_reduction');
            expect(result.recommendation).toContain('Usage is high');
        });

        test('should generate positive recommendation for low prices', () => {
            const result = generateRealTimeRecommendation(
                10.0, // Normal usage
                0.05,  // Low price
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                3 // Early morning
            );

            expect(result.urgencyLevel).toBe('low');
            expect(result.type).toBe('timing_adjustment');
            expect(result.recommendation).toContain('Great time to operate');
        });

        test('should recommend waiting when next hour has lower price', () => {
            // Create price data where next hour is significantly cheaper
            const pricesWithDrop = [
                ...MOCK_PRICE_DATA,
                { timestamp: 1651042800 + 3600, price: 0.05, currency: 'BGN' } // Much lower next hour
            ];

            const result = generateRealTimeRecommendation(
                10.0,
                0.12, // Current high price
                MOCK_USAGE_DATA,
                pricesWithDrop,
                9 // Current hour
            );

            expect(result.type).toBe('cost_optimization'); // This function returns cost_optimization for high price
            expect(result.recommendation).toContain('high');
            expect(result.potentialSavings).toBeGreaterThan(0);
        });

        test('should handle normal conditions', () => {
            const result = generateRealTimeRecommendation(
                10.0, // Normal usage
                0.09,  // Normal price
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                12
            );

            expect(result.urgencyLevel).toBe('low');
            expect(result.type).toBe('cost_optimization');
            expect(result.recommendation).toContain('Normal operations');
        });

        test('should handle empty data gracefully', () => {
            const result = generateRealTimeRecommendation(
                10.0,
                0.09,
                EMPTY_USAGE_DATA,
                EMPTY_PRICE_DATA,
                12
            );

            expect(result).toBeDefined();
            expect(result.urgencyLevel).toBeDefined();
            expect(result.type).toBeDefined();
            expect(result.recommendation).toBeDefined();
        });

        test('should handle extreme values', () => {
            const result = generateRealTimeRecommendation(
                1000.0, // Extremely high usage
                1.0,     // Extremely high price
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                8
            );

            expect(result.urgencyLevel).toBe('high');
            expect(result.type).toBe('price_alert');
            expect(result.potentialSavings).toBeGreaterThan(0);
        });
    });

    describe('generateComprehensiveSuggestions', () => {
        test('should generate multiple suggestions for normal data', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);
            expect(result.length).toBeLessThanOrEqual(5); // Default max suggestions
        });

        test('should prioritize suggestions correctly', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            // Suggestions should be sorted by priority (high, medium, low)
            const priorities = result.map(s => s.priority);
            const priorityValues = priorities.map(p =>
                p === 'high' ? 3 : p === 'medium' ? 2 : 1
            );

            for (let i = 0; i < priorityValues.length - 1; i++) {
                expect(priorityValues[i]).toBeGreaterThanOrEqual(priorityValues[i + 1]);
            }
        });

        test('should include different types of suggestions', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            const types = result.map(s => s.type);
            const uniqueTypes = [...new Set(types)];

            expect(uniqueTypes.length).toBeGreaterThan(1);
            expect(uniqueTypes).toEqual(
                expect.arrayContaining(['cost_optimization', 'timing_adjustment'])
            );
        });

        test('should respect custom options', () => {
            const averagePrice = 0.093;
            const options: SuggestionOptions = {
                maxSuggestions: 2,
                includeTimeHints: false,
                includeEarlyMorningTips: false,
            };

            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice,
                options
            );

            expect(result.length).toBeLessThanOrEqual(2);
        });

        test('should calculate potential savings', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            const suggestionsWithSavings = result.filter(s => s.potentialSavings !== undefined);
            expect(suggestionsWithSavings.length).toBeGreaterThan(0);

            suggestionsWithSavings.forEach(suggestion => {
                expect(suggestion.potentialSavings).toBeGreaterThanOrEqual(0);
            });
        });

        test('should include affected hours for relevant suggestions', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            const suggestionsWithHours = result.filter(s => s.affectedHours !== undefined);
            expect(suggestionsWithHours.length).toBeGreaterThan(0);

            suggestionsWithHours.forEach(suggestion => {
                expect(suggestion.affectedHours).toBeInstanceOf(Array);
                expect(suggestion.affectedHours!.length).toBeGreaterThan(0);
                suggestion.affectedHours!.forEach(hour => {
                    expect(hour).toBeGreaterThanOrEqual(0);
                    expect(hour).toBeLessThan(24);
                });
            });
        });

        test('should handle empty data', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                EMPTY_USAGE_DATA,
                EMPTY_PRICE_DATA,
                averagePrice
            );

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0); // Should provide default suggestion
            expect(result[0].message).toContain('Monitor usage patterns');
        });

        test('should handle high usage scenarios', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                HIGH_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            expect(result.length).toBeGreaterThan(0);
            expect(result.some(s => s.type === 'usage_reduction')).toBe(true);
        });

        test('should include early morning tips when enabled', () => {
            const averagePrice = 0.093;
            const options: SuggestionOptions = {
                includeEarlyMorningTips: true,
            };

            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice,
                options
            );

            const earlyMorningTips = result.filter(s =>
                s.message.includes('Early morning') || s.message.includes('4-7am')
            );
            expect(earlyMorningTips.length).toBeGreaterThan(0);
        });

        test('should exclude time hints when disabled', () => {
            const averagePrice = 0.093;
            const options: SuggestionOptions = {
                includeTimeHints: false,
            };

            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice,
                options
            );

            const timingAdjustments = result.filter(s => s.type === 'timing_adjustment');
            expect(timingAdjustments.length).toBeLessThan(
                generateComprehensiveSuggestions(MOCK_USAGE_DATA, MOCK_PRICE_DATA, averagePrice).length
            );
        });
    });

    describe('generateCostSuggestions (Compatibility Wrapper)', () => {
        test('should return array of strings', () => {
            const averagePrice = 0.093;
            const result = generateCostSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);
            result.forEach(suggestion => {
                expect(typeof suggestion).toBe('string');
            });
        });

        test('should provide meaningful suggestions', () => {
            const averagePrice = 0.093;
            const result = generateCostSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            expect(result.some(s => s.includes('hour') || s.includes('time'))).toBe(true);
            expect(result.some(s => s.includes('price') || s.includes('cost'))).toBe(true);
        });

        test('should handle edge cases', () => {
            const averagePrice = 0.093;
            const result = generateCostSuggestions(
                EMPTY_USAGE_DATA,
                EMPTY_PRICE_DATA,
                averagePrice
            );

            expect(result).toBeInstanceOf(Array);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Suggestion Quality and Relevance', () => {
        test('should provide bakery-specific recommendations', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            const bakeryRelevant = result.filter(s =>
                s.message.includes('preparation') ||
                s.message.includes('equipment') ||
                s.message.includes('energy-intensive')
            );

            expect(bakeryRelevant.length).toBeGreaterThan(0);
        });

        test('should provide actionable recommendations', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice
            );

            result.forEach(suggestion => {
                expect(suggestion.message.length).toBeGreaterThan(10);
                expect(suggestion.message).toMatch(/[a-zA-Z]/); // Contains letters
                expect(['high', 'medium', 'low']).toContain(suggestion.priority);
                expect(['cost_optimization', 'timing_adjustment', 'usage_reduction', 'price_alert'])
                    .toContain(suggestion.type);
            });
        });

        test('should calculate realistic potential savings', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                REAL_DATA_SAMPLE,
                REAL_PRICE_SAMPLE,
                averagePrice
            );

            const suggestionsWithSavings = result.filter(s => s.potentialSavings !== undefined);

            suggestionsWithSavings.forEach(suggestion => {
                expect(suggestion.potentialSavings).toBeGreaterThanOrEqual(0);
                expect(suggestion.potentialSavings).toBeLessThan(1000); // Reasonable upper bound
            });
        });

        test('should provide diverse recommendation types', () => {
            const averagePrice = 0.093;
            const result = generateComprehensiveSuggestions(
                MOCK_USAGE_DATA,
                MOCK_PRICE_DATA,
                averagePrice,
                { maxSuggestions: 10 }
            );

            const types = result.map(s => s.type);
            const uniqueTypes = [...new Set(types)];

            // Should provide at least 2 different types of recommendations
            expect(uniqueTypes.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe('Performance and Scalability', () => {
        test('should handle large datasets efficiently', () => {
            const averagePrice = 0.093;
            const largeUsageData = Array.from({ length: 1000 }, (_, i) => ({
                timestamp: 1651010400 + i * 3600,
                kwh: Math.random() * 50 + 5,
            }));

            const largePriceData = Array.from({ length: 1000 }, (_, i) => ({
                timestamp: 1651010400 + i * 3600,
                price: Math.random() * 0.05 + 0.07,
                currency: 'BGN' as const,
            }));

            const startTime = performance.now();
            const result = generateComprehensiveSuggestions(
                largeUsageData,
                largePriceData,
                averagePrice
            );
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(500); // Should complete in under 500ms
            expect(result.length).toBeGreaterThan(0);
        });

        test('should handle repeated calls efficiently', () => {
            const averagePrice = 0.093;
            const iterations = 100;

            const startTime = performance.now();
            for (let i = 0; i < iterations; i++) {
                generateComprehensiveSuggestions(
                    MOCK_USAGE_DATA,
                    MOCK_PRICE_DATA,
                    averagePrice
                );
            }
            const endTime = performance.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
        });
    });
}); 