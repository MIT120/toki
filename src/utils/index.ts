// Export only the calculation utilities actually used by components
export {
    calculateAveragePrice, calculateEfficiencyScore, calculatePeakAnalysis,
    calculateTotalCost, calculateTotalUsage, createHourlyDataPoints,
    createPriceByHourMap, createUsageByHourMap,
    findLowPriceHours, formatHour, getHourFromTimestamp,
    performCompleteElectricityAnalysis, roundCurrency,
    roundPrice, roundToDecimals, roundUsage, timestampToDate
} from './electricity-calculations';

export type {
    ElectricityAnalysisResult, HourlyDataPoint, PeakAnalysis
} from './electricity-calculations';

// Export only the suggestion utilities actually used by components  
export {
    generateComprehensiveSuggestions, generateCostSuggestions, generateRealTimeRecommendation
} from './electricity-suggestions';

export type {
    CostSuggestion, RealTimeRecommendation, SuggestionOptions
} from './electricity-suggestions';

// Other utilities
export * from './analytics-wrapper';
export * from './error-logger';
export * from './feature-flag-utils';

// Service utilities
export {
    executeWithErrorHandling, validateDate, validateDateRange, validateMeteringPointId, withPerformanceTracking
} from './service-helpers';

