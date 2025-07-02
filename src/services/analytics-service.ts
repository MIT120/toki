"use server";

import { PostHog } from 'posthog-node';
import {
    AnalyticsEventProperties,
    AnalyticsUser,
    DashboardEventType
} from '../types';

// Server-side PostHog client
let posthogServer: PostHog | null = null;

function getPostHogServer(): PostHog {
    if (!posthogServer) {
        if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            throw new Error('POSTHOG_API_KEY environment variable is required');
        }

        posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
            host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
            flushAt: 20,
            flushInterval: 10000,
        });
    }
    return posthogServer;
}

// Server Actions for Analytics
export async function trackEventAction(
    event: DashboardEventType | string,
    properties?: AnalyticsEventProperties,
    userId?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const posthog = getPostHogServer();

        const eventProperties = {
            ...properties,
            timestamp: new Date().toISOString(),
            source: 'dashboard',
            environment: process.env.NODE_ENV || 'development',
        };

        await posthog.capture({
            distinctId: userId || 'anonymous',
            event,
            properties: eventProperties,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to track event:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function identifyUserAction(
    userId: string,
    userProperties: AnalyticsUser
): Promise<{ success: boolean; error?: string }> {
    try {
        const posthog = getPostHogServer();

        await posthog.identify({
            distinctId: userId,
            properties: {
                ...userProperties,
                last_seen: new Date().toISOString(),
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to identify user:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function trackPageViewAction(
    userId: string,
    pagePath: string,
    properties?: AnalyticsEventProperties
): Promise<{ success: boolean; error?: string }> {
    try {
        return await trackEventAction(
            '$pageview',
            {
                ...properties,
                page_path: pagePath,
                $current_url: pagePath,
            },
            userId
        );
    } catch (error) {
        console.error('Failed to track page view:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function trackDashboardViewAction(
    userId: string,
    properties: {
        meteringPointsCount: number;
        totalConsumption: number;
        totalCost: number;
        loadTime?: number;
        date?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'dashboard_viewed',
        {
            metering_points_count: properties.meteringPointsCount,
            total_consumption: properties.totalConsumption,
            total_cost: properties.totalCost,
            dashboard_load_time: properties.loadTime,
            dashboard_date: properties.date,
        },
        userId
    );
}

export async function trackMeteringPointInteractionAction(
    userId: string,
    meteringPointId: string,
    meteringPointName: string,
    actionType: 'view' | 'select' | 'analyze',
    properties?: AnalyticsEventProperties
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'metering_point_selected',
        {
            metering_point_id: meteringPointId,
            metering_point_name: meteringPointName,
            action_type: actionType,
            ...properties,
        },
        userId
    );
}

export async function trackCostAnalysisAction(
    userId: string,
    meteringPointId: string,
    analysisData: {
        totalKwh: number;
        totalCost: number;
        averagePrice: number;
        peakUsageHour: number;
        potentialSavings?: number;
    }
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'cost_analysis_viewed',
        {
            metering_point_id: meteringPointId,
            total_consumption: analysisData.totalKwh,
            total_cost: analysisData.totalCost,
            peak_usage_hour: analysisData.peakUsageHour,
            cost_savings_identified: analysisData.potentialSavings,
        },
        userId
    );
}

export async function trackInsightViewAction(
    userId: string,
    insightType: string,
    urgencyLevel: 'low' | 'medium' | 'high',
    potentialSavings?: number
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'insights_viewed',
        {
            insight_type: insightType,
            insight_urgency: urgencyLevel,
            potential_savings: potentialSavings,
        },
        userId
    );
}

export async function trackErrorAction(
    userId: string,
    error: Error,
    context?: {
        component?: string;
        apiEndpoint?: string;
        userAction?: string;
    }
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'error_occurred',
        {
            error_message: error.message,
            error_stack: error.stack,
            component_name: context?.component,
            api_endpoint: context?.apiEndpoint,
            action_type: context?.userAction as any,
        },
        userId
    );
}

export async function trackPerformanceAction(
    userId: string,
    performanceData: {
        componentName: string;
        loadTime: number;
        apiEndpoint?: string;
        dataPointsCount?: number;
    }
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'performance_measured',
        {
            component_name: performanceData.componentName,
            load_time: performanceData.loadTime,
            api_endpoint: performanceData.apiEndpoint,
            data_points_count: performanceData.dataPointsCount,
        },
        userId
    );
}

export async function trackFilterApplicationAction(
    userId: string,
    filterType: string,
    filterValue: string,
    componentName: string
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'filter_applied',
        {
            filter_applied: `${filterType}:${filterValue}`,
            component_name: componentName,
            action_type: 'filter',
        },
        userId
    );
}

export async function trackDataExportAction(
    userId: string,
    exportType: string,
    dataRange: string,
    recordCount: number
): Promise<{ success: boolean; error?: string }> {
    return await trackEventAction(
        'data_exported',
        {
            action_type: 'export',
            analysis_type: exportType as any,
            date_range: dataRange,
            data_points_count: recordCount,
        },
        userId
    );
}

// Utility function to flush events (useful for testing or before app shutdown)
export async function flushAnalyticsAction(): Promise<{ success: boolean; error?: string }> {
    try {
        if (posthogServer) {
            await posthogServer.flush();
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to flush analytics:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Shutdown function to properly close PostHog connection
export async function shutdownAnalyticsAction(): Promise<{ success: boolean; error?: string }> {
    try {
        if (posthogServer) {
            await posthogServer.shutdown();
            posthogServer = null;
        }
        return { success: true };
    } catch (error) {
        console.error('Failed to shutdown analytics:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Analytics Summary Actions
export async function getDailySummaryAction(
    meteringPointId: string,
    date: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        // This would typically fetch from your database or analytics service
        // For now, returning mock data structure
        const mockData = {
            meteringPointId,
            date,
            totalConsumption: 0,
            totalCost: 0,
            peakUsageHour: 0,
            averageUsage: 0,
            events: []
        };

        return { success: true, data: mockData };
    } catch (error) {
        console.error('Failed to get daily summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getWeeklySummaryAction(
    meteringPointId: string,
    weekStartDate: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        // This would typically fetch from your database or analytics service
        // For now, returning mock data structure
        const mockData = {
            meteringPointId,
            weekStartDate,
            totalConsumption: 0,
            totalCost: 0,
            dailyBreakdown: [],
            trends: {}
        };

        return { success: true, data: mockData };
    } catch (error) {
        console.error('Failed to get weekly summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getMonthlySummaryAction(
    meteringPointId: string,
    month: number,
    year: number
): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        // This would typically fetch from your database or analytics service
        // For now, returning mock data structure
        const mockData = {
            meteringPointId,
            month,
            year,
            totalConsumption: 0,
            totalCost: 0,
            weeklyBreakdown: [],
            monthlyTrends: {}
        };

        return { success: true, data: mockData };
    } catch (error) {
        console.error('Failed to get monthly summary:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
} 