"use server";

import { CostAnalysis, PriceRecord, UsageRecord } from '../types';
import {
    calculateEfficiencyScore,
    calculateTotalUsage,
    getHourFromTimestamp,
    performCompleteElectricityAnalysis,
    roundCurrency,
    roundPrice,
    roundUsage
} from '../utils/electricity-calculations';
import {
    generateComprehensiveSuggestions,
    generateRealTimeRecommendation,
    RealTimeRecommendation
} from '../utils/electricity-suggestions';

/**
 * Simple electricity calculation service focused on bakery requirements
 * Provides basic APIs for electricity analysis and cost suggestions
 */

// =================== BASIC ANALYSIS SERVICE ===================

export async function calculateCostAnalysisCompatible(
    meteringPointId: string,
    usage: UsageRecord[],
    prices: PriceRecord[]
): Promise<CostAnalysis> {
    const analysis = performCompleteElectricityAnalysis(usage, prices);
    const suggestions = generateComprehensiveSuggestions(usage, prices, analysis.averagePrice);

    return {
        meteringPointId,
        date: new Date().toISOString().split('T')[0],
        totalKwh: roundUsage(analysis.totalKwh),
        totalCost: roundCurrency(analysis.totalCost),
        averagePrice: roundPrice(analysis.averagePrice),
        peakUsageHour: analysis.peakAnalysis.peakUsageHour,
        peakCostHour: analysis.peakAnalysis.peakCostHour,
        suggestions: suggestions.map(s => s.message)
    };
}

// =================== REAL-TIME INSIGHTS SERVICE ===================

export async function getRealTimeInsights(
    meteringPointId: string,
    currentHour: number,
    usage: UsageRecord[],
    prices: PriceRecord[]
): Promise<{
    recommendation: RealTimeRecommendation;
    currentUsage: number;
    currentPrice: number;
    currentCost: number;
    efficiencyScore: number;
}> {
    // Filter current hour data
    const currentUsageRecords = usage.filter(u => {
        const hour = getHourFromTimestamp(u.timestamp);
        return hour === currentHour;
    });

    const currentPriceRecord = prices.find(p => {
        const hour = getHourFromTimestamp(p.timestamp);
        return hour === currentHour;
    });

    const currentUsage = calculateTotalUsage(currentUsageRecords);
    const currentPrice = currentPriceRecord?.price || 0;
    const currentCost = currentUsage * currentPrice;

    // Generate real-time recommendation
    const recommendation = generateRealTimeRecommendation(
        currentUsage,
        currentPrice,
        usage,
        prices,
        currentHour
    );

    return {
        recommendation,
        currentUsage: roundUsage(currentUsage),
        currentPrice: roundPrice(currentPrice),
        currentCost: roundCurrency(currentCost),
        efficiencyScore: roundUsage(calculateEfficiencyScore(usage))
    };
} 