export interface PriceRecord {
    timestamp: number;
    price: number;
    currency: string;
}

export interface UsageRecord {
    timestamp: number;
    kwh: number;
}

export interface ElectricityData {
    meteringPointId: string;
    date: string;
    usage: UsageRecord[];
    prices: PriceRecord[];
}

export interface CostAnalysis {
    meteringPointId: string;
    date: string;
    totalKwh: number;
    totalCost: number;
    averagePrice: number;
    peakUsageHour: number;
    peakCostHour: number;
    suggestions: string[];
}

export interface Customer {
    name: string;
    owner: string;
    meteringPoints: string[];
}

export interface MeteringPoint {
    id: string;
    name: string;
    location?: string;
    customerId?: string;
}

export interface HourlyData {
    hour: number;
    usage: number;
    price: number;
    cost: number;
}

export interface DailyAnalytics {
    date: string;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    peakHour: number;
    offPeakHour: number;
}

export interface WeeklyAnalytics {
    weekStart: string;
    weekEnd: string;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    dailyBreakdown: DailyAnalytics[];
}

export interface MonthlyAnalytics {
    month: string;
    year: number;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    weeklyBreakdown: WeeklyAnalytics[];
}

export interface InsightData {
    meteringPointId: string;
    date: string;
    insights: {
        highUsagePeriods: Array<{
            hour: number;
            usage: number;
            cost: number;
        }>;
        lowCostOpportunities: Array<{
            hour: number;
            potentialSavings: number;
            recommendation: string;
        }>;
        trends: {
            usageTrend: 'increasing' | 'decreasing' | 'stable';
            costTrend: 'increasing' | 'decreasing' | 'stable';
            efficiency: number;
        };
    };
}

export interface RealTimeInsights {
    meteringPointId: string;
    currentUsage: number;
    currentCost: number;
    currentPrice: number;
    hourProgress: number;
    todayTotal: {
        usage: number;
        cost: number;
    };
    recommendations: Array<{
        type: 'cost_optimization' | 'usage_reduction' | 'timing_adjustment';
        urgencyLevel: 'low' | 'medium' | 'high';
        message: string;
        potentialSavings?: number;
    }>;
    trends: {
        usageChange: number;
        costChange: number;
        efficiencyScore: number;
    };
    urgencyLevel?: 'low' | 'medium' | 'high';
    potentialSavings?: number;
    lastUpdated: string;
}

export interface DashboardData {
    totalMeteringPoints: number;
    totalUsage: number;
    totalCost: number;
    averagePrice: number;
    meteringPoints: Array<{
        id: string;
        name: string;
        todayUsage: number;
        todayCost: number;
        status: 'normal' | 'high' | 'alert';
    }>;
    recentAnalytics: DailyAnalytics[];
}

// PostHog Analytics Types
export interface AnalyticsUser {
    id: string;
    email?: string;
    name?: string;
    role?: string;
    customerName?: string;
    meteringPointsCount?: number;
}

export interface AnalyticsEventProperties {
    // Dashboard Events
    dashboard_date?: string;
    dashboard_load_time?: number;
    metering_points_count?: number;
    total_consumption?: number;
    total_cost?: number;

    // Metering Point Events
    metering_point_id?: string;
    metering_point_name?: string;
    location?: string;

    // Data Analysis Events
    analysis_type?: 'hourly' | 'daily' | 'weekly' | 'monthly';
    date_range?: string;
    data_points_count?: number;

    // Insight Events
    insight_type?: string;
    insight_urgency?: 'low' | 'medium' | 'high';
    potential_savings?: number;

    // User Interaction Events
    component_name?: string;
    action_type?: 'click' | 'view' | 'filter' | 'export' | 'refresh' | 'select' | 'analyze';
    filter_applied?: string;

    // Performance Events
    load_time?: number;
    error_message?: string;
    api_endpoint?: string;

    // Business Metrics
    cost_savings_identified?: number;
    efficiency_score?: number;
    peak_usage_hour?: number;

    // Session Context
    session_duration?: number;
    page_path?: string;
    referrer?: string;

    // Custom Properties
    [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsEvent {
    event: string;
    properties?: AnalyticsEventProperties;
    timestamp?: Date;
}

export type DashboardEventType =
    | 'dashboard_viewed'
    | 'dashboard_refreshed'
    | 'dashboard_date_changed'
    | 'metering_point_selected'
    | 'cost_analysis_viewed'
    | 'hourly_data_viewed'
    | 'insights_viewed'
    | 'filter_applied'
    | 'data_exported'
    | 'error_occurred'
    | 'performance_measured';

export interface AnalyticsConfig {
    enableDebugMode?: boolean;
    enablePerformanceTracking?: boolean;
    enableErrorTracking?: boolean;
    enableUserTracking?: boolean;
    trackPageViews?: boolean;
    batchEvents?: boolean;
    flushInterval?: number;
}

// Translation System Types
export * from './translation';

// Re-export all service types
export * from './services';
