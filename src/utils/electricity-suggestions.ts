import { PriceRecord, UsageRecord } from '../types';
import {
    calculateAveragePrice,
    calculateTotalUsage,
    createPriceByHourMap,
    createUsageByHourMap,
    findLowPriceHours,
    formatHour,
    getHourFromTimestamp,
    roundPrice,
    roundUsage
} from './electricity-calculations';

/**
 * Electricity cost suggestion utilities for bakery use case
 * Provides practical suggestions for cost optimization
 */

export interface SuggestionOptions {
    highPriceMultiplier?: number;
    lowPriceMultiplier?: number;
    maxSuggestions?: number;
    includeTimeHints?: boolean;
    includeEarlyMorningTips?: boolean;
}

export interface CostSuggestion {
    type: 'cost_optimization' | 'timing_adjustment' | 'usage_reduction' | 'price_alert';
    priority: 'high' | 'medium' | 'low';
    message: string;
    affectedHours?: number[];
    potentialSavings?: number;
}

// =================== REAL-TIME RECOMMENDATIONS ===================

export interface RealTimeRecommendation {
    recommendation: string;
    urgencyLevel: 'low' | 'medium' | 'high';
    type: 'cost_optimization' | 'usage_reduction' | 'timing_adjustment' | 'price_alert';
    potentialSavings?: number;
}

export function generateRealTimeRecommendation(
    currentUsage: number,
    currentPrice: number,
    usage: UsageRecord[],
    prices: PriceRecord[],
    currentHour: number = new Date().getHours()
): RealTimeRecommendation {
    const avgPrice = calculateAveragePrice(prices);
    const avgUsage = calculateTotalUsage(usage) / usage.length;

    const priceThresholdHigh = avgPrice * 1.2;
    const priceThresholdLow = avgPrice * 0.8;
    const usageThresholdHigh = avgUsage * 1.5;

    if (currentPrice > priceThresholdHigh && currentUsage > usageThresholdHigh) {
        return {
            recommendation: `HIGH ALERT: Both price (${roundPrice(currentPrice)} BGN/kWh) and usage (${roundUsage(currentUsage)} kWh) are very high right now. Consider postponing non-essential activities.`,
            urgencyLevel: 'high',
            type: 'price_alert',
            potentialSavings: (currentPrice - avgPrice) * currentUsage
        };
    }

    if (currentPrice > priceThresholdHigh) {
        return {
            recommendation: `Price is high right now (${roundPrice(currentPrice)} BGN/kWh). Consider reducing usage or postponing energy-intensive activities to the next hour.`,
            urgencyLevel: 'medium',
            type: 'cost_optimization',
            potentialSavings: (currentPrice - avgPrice) * currentUsage
        };
    }

    if (currentUsage > usageThresholdHigh) {
        return {
            recommendation: `Usage is high this hour (${roundUsage(currentUsage)} kWh). Monitor equipment to ensure efficient operation.`,
            urgencyLevel: 'medium',
            type: 'usage_reduction'
        };
    }

    if (currentPrice < priceThresholdLow) {
        return {
            recommendation: `Great time to operate! Price is low (${roundPrice(currentPrice)} BGN/kWh). Consider running energy-intensive equipment now.`,
            urgencyLevel: 'low',
            type: 'timing_adjustment'
        };
    }

    // Check next hour price
    const nextHourPrice = prices.find(p =>
        getHourFromTimestamp(p.timestamp) === (currentHour + 1) % 24
    );

    if (nextHourPrice && nextHourPrice.price < currentPrice * 0.9) {
        return {
            recommendation: `Price will drop significantly next hour (${roundPrice(nextHourPrice.price)} BGN/kWh). Consider waiting for non-urgent activities.`,
            urgencyLevel: 'low',
            type: 'timing_adjustment',
            potentialSavings: (currentPrice - nextHourPrice.price) * currentUsage
        };
    }

    return {
        recommendation: `Normal operations. Current price: ${roundPrice(currentPrice)} BGN/kWh, usage: ${roundUsage(currentUsage)} kWh.`,
        urgencyLevel: 'low',
        type: 'cost_optimization'
    };
}

// =================== COMPREHENSIVE SUGGESTION GENERATION ===================

export function generateComprehensiveSuggestions(
    usage: UsageRecord[],
    prices: PriceRecord[],
    averagePrice: number,
    options: SuggestionOptions = {}
): CostSuggestion[] {
    const suggestions: CostSuggestion[] = [];
    const {
        highPriceMultiplier = 1.2,
        lowPriceMultiplier = 0.8,
        maxSuggestions = 5,
        includeTimeHints = true,
        includeEarlyMorningTips = true
    } = options;

    const usageByHour = createUsageByHourMap(usage);
    const priceByHour = createPriceByHourMap(prices);

    // High cost period suggestions
    const highPriceThreshold = averagePrice * highPriceMultiplier;
    const highCostHours: number[] = [];
    for (const [hour, usage] of Array.from(usageByHour.entries())) {
        const price = priceByHour.get(hour) || 0;
        if (price > highPriceThreshold && usage > 0) {
            highCostHours.push(hour);
        }
    }

    if (highCostHours.length > 0) {
        const hoursFormatted = highCostHours.map(formatHour).join(', ');
        suggestions.push({
            type: 'cost_optimization',
            priority: 'high',
            message: `Consider reducing usage during high-price hours: ${hoursFormatted}`,
            affectedHours: highCostHours,
            potentialSavings: calculatePotentialSavings(highCostHours, usageByHour, priceByHour, averagePrice)
        });
    }

    // Low price period suggestions
    if (includeTimeHints) {
        const lowPriceHours = findLowPriceHours(prices, averagePrice * lowPriceMultiplier);
        if (lowPriceHours.length > 0) {
            const hoursFormatted = lowPriceHours.map(formatHour).join(', ');
            suggestions.push({
                type: 'timing_adjustment',
                priority: 'medium',
                message: `Best times for energy-intensive tasks: ${hoursFormatted} (low prices)`,
                affectedHours: lowPriceHours
            });
        }
    }

    // Peak usage suggestions
    if (usageByHour.size > 0) {
        const maxUsage = Math.max(...Array.from(usageByHour.values()));
        const peakHours = Array.from(usageByHour.entries())
            .filter(([_, usage]) => usage === maxUsage)
            .map(([hour, _]) => hour);

        if (peakHours.length > 0) {
            const hoursFormatted = peakHours.map(formatHour).join(', ');
            suggestions.push({
                type: 'usage_reduction',
                priority: 'medium',
                message: `Peak usage at ${hoursFormatted} - monitor equipment efficiency during these hours`,
                affectedHours: peakHours
            });
        }
    }

    // Early morning suggestions
    if (includeEarlyMorningTips) {
        const earlyMorningHours = [4, 5, 6, 7];
        const earlyMorningUsageRecords = usage.filter(u => {
            const hour = getHourFromTimestamp(u.timestamp);
            return earlyMorningHours.includes(hour);
        });
        const earlyMorningUsage = calculateTotalUsage(earlyMorningUsageRecords);

        const earlyMorningPrices = earlyMorningHours
            .map(hour => priceByHour.get(hour))
            .filter(price => price !== undefined) as number[];

        const avgEarlyMorningPrice = earlyMorningPrices.length > 0
            ? earlyMorningPrices.reduce((sum, price) => sum + price, 0) / earlyMorningPrices.length
            : 0;

        if (earlyMorningUsage > 0 && avgEarlyMorningPrice < averagePrice) {
            suggestions.push({
                type: 'timing_adjustment',
                priority: 'low',
                message: 'Early morning (4-7am) offers good price opportunities for preparation work',
                affectedHours: earlyMorningHours,
                potentialSavings: (averagePrice - avgEarlyMorningPrice) * earlyMorningUsage
            });
        }
    }

    // Sort by priority and limit
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    // If no specific suggestions, add default
    if (suggestions.length === 0) {
        suggestions.push({
            type: 'cost_optimization',
            priority: 'low',
            message: 'Monitor usage patterns to identify optimization opportunities'
        });
    }

    return suggestions.slice(0, maxSuggestions);
}

// =================== HELPER FUNCTIONS ===================

function calculatePotentialSavings(
    hours: number[],
    usageByHour: Map<number, number>,
    priceByHour: Map<number, number>,
    averagePrice: number
): number {
    return hours.reduce((savings, hour) => {
        const usage = usageByHour.get(hour) || 0;
        const price = priceByHour.get(hour) || 0;
        const potentialSaving = Math.max(0, (price - averagePrice) * usage);
        return savings + potentialSaving;
    }, 0);
}

// =================== COMPATIBILITY WRAPPER ===================

export function generateCostSuggestions(
    usage: UsageRecord[],
    prices: PriceRecord[],
    averagePrice: number
): string[] {
    const suggestions = generateComprehensiveSuggestions(usage, prices, averagePrice);
    return suggestions.map(s => s.message);
} 