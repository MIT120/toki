// Service Response Types
import type { UserAction } from './index';

export interface ServiceResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string | undefined;
    usedMockData?: boolean;
}

// Analytics Service Types
export interface AnalyticsSummaryData {
    meteringPointId: string;
    totalConsumption: number;
    totalCost: number;
    peakUsageHour: number;
    averageUsage: number;
    events: AnalyticsEvent[];
}

export interface DailySummaryData extends AnalyticsSummaryData {
    date: string;
}

export interface WeeklySummaryData extends AnalyticsSummaryData {
    weekStartDate: string;
    dailyBreakdown: DailySummaryData[];
    trends: UsageTrends;
}

export interface MonthlySummaryData extends AnalyticsSummaryData {
    month: number;
    year: number;
    weeklyBreakdown: WeeklySummaryData[];
    monthlyTrends: UsageTrends;
}

export interface UsageTrends {
    usageChange: number;
    costChange: number;
    efficiencyScore: number;
    pattern: 'increasing' | 'decreasing' | 'stable';
}

export interface AnalyticsEvent {
    id: string;
    timestamp: number;
    eventType: string;
    meteringPointId: string;
    value: number;
    unit: string;
    metadata?: Record<string, string | number | boolean>;
}

// Feature Flag Service Types
export interface FeatureFlagUser {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    customAttributes?: Record<string, string | number | boolean>;
}

export interface FeatureFlagContext {
    userId: string;
    userProperties?: FeatureFlagUser;
    timestamp?: number;
    sessionId?: string;
}

// Error Context Types
export interface ErrorContext {
    component?: string;
    apiEndpoint?: string;
    userAction?: UserAction;
    metadata?: Record<string, string | number | boolean>;
}

// Performance Tracking Types
export interface PerformanceMetrics {
    componentName: string;
    loadTime: number;
    apiEndpoint?: string;
    dataPointsCount?: number;
    renderTime?: number;
    memoryUsage?: number;
}

// Analytics Wrapper Types
export interface AnalyticsProperties {
    [key: string]: string | number | boolean;
}

export interface AnalyticsContext {
    userId: string;
    sessionId?: string;
    userAction?: UserAction;
    component?: string;
    timestamp?: Date;
}

export interface AnalyticsCallbacks<T = unknown> {
    onSuccess?: (data: T) => AnalyticsProperties;
    onError?: (error: Error) => AnalyticsProperties;
}

export interface RefreshAnalyticsOptions {
    refreshFn: () => Promise<unknown>;
    userId: string;
    componentName: string;
    additionalProps?: AnalyticsProperties;
}

// Data Processing Types
export interface DataProcessingResult<T> {
    data: T[];
    processedCount: number;
    errors: string[];
    completedAt: Date;
}

export interface DateRangeProcessor<T> {
    (date: Date): Promise<T>;
}

export interface DataQualityMetrics {
    completeness: number;
    hasGaps: boolean;
    gapHours?: number[];
    dataPointsCount: number;
    expectedCount: number;
}

// Service Configuration Types
export interface ServiceConfiguration {
    enableRetry: boolean;
    retryAttempts: number;
    retryDelay: number;
    timeout: number;
    enableCaching: boolean;
    cacheTimeout: number;
}

export interface ServiceMetadata {
    requestId: string;
    userId?: string;
    timestamp: Date;
    source: string;
    version: string;
} 