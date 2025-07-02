import type { FeatureFlagContext } from '../services/feature-flag-service';

// Utility function to create feature flag context from user data
export function createFeatureFlagContext(
    userId: string,
    additionalContext: Partial<FeatureFlagContext> = {}
): FeatureFlagContext {
    return {
        userId,
        ...additionalContext,
    };
}

// Predefined dashboard feature flags for client-side usage
export const DASHBOARD_FEATURE_FLAGS = {
    NEW_COST_ANALYSIS_UI: 'new-cost-analysis-ui',
    REAL_TIME_INSIGHTS: 'real-time-insights',
    ADVANCED_FILTERING: 'advanced-filtering',
    DATA_EXPORT_V2: 'data-export-v2',
    AI_RECOMMENDATIONS: 'ai-recommendations',
    DARK_MODE: 'dark-mode',
    BETA_FEATURES: 'beta-features',
    HOURLY_CHART_V2: 'hourly-chart-v2',
    COST_OPTIMIZATION_TIPS: 'cost-optimization-tips',
} as const;

// Type for feature flag keys
export type DashboardFeatureFlag = typeof DASHBOARD_FEATURE_FLAGS[keyof typeof DASHBOARD_FEATURE_FLAGS];

// Helper to get all dashboard feature flag keys as array
export function getDashboardFeatureFlagKeys(): string[] {
    return Object.values(DASHBOARD_FEATURE_FLAGS);
} 