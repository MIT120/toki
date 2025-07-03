"use client";

import posthog from 'posthog-js';
import { useCallback, useEffect, useRef } from 'react';
import {
    identifyUserAction,
    trackCostAnalysisAction,
    trackDashboardViewAction,
    trackDataExportAction,
    trackErrorAction,
    trackEventAction,
    trackFilterApplicationAction,
    trackInsightViewAction,
    trackMeteringPointInteractionAction,
    trackPageViewAction,
    trackPerformanceAction
} from '../services/analytics-service';
import {
    AnalyticsEventProperties,
    AnalyticsUser,
    DashboardEventType
} from '../types';

interface UseAnalyticsOptions {
    userId?: string;
    enableClientSideTracking?: boolean;
    enableServerSideTracking?: boolean;
    enablePerformanceTracking?: boolean;
    enableErrorTracking?: boolean;
}

interface UseAnalyticsReturn {
    // Event tracking
    trackEvent: (event: DashboardEventType | string, properties?: AnalyticsEventProperties) => Promise<void>;
    trackPageView: (pagePath: string, properties?: AnalyticsEventProperties) => Promise<void>;

    // User identification
    identify: (userId: string, userProperties: AnalyticsUser) => Promise<void>;

    // Dashboard-specific tracking
    trackDashboardView: (properties: {
        meteringPointsCount: number;
        totalConsumption: number;
        totalCost: number;
        loadTime?: number;
        date?: string;
    }) => Promise<void>;

    trackMeteringPointInteraction: (
        meteringPointId: string,
        meteringPointName: string,
        actionType: 'view' | 'select' | 'analyze',
        properties?: AnalyticsEventProperties
    ) => Promise<void>;

    trackCostAnalysis: (
        meteringPointId: string,
        analysisData: {
            totalKwh: number;
            totalCost: number;
            averagePrice: number;
            peakUsageHour: number;
            potentialSavings?: number;
        }
    ) => Promise<void>;

    trackInsightView: (
        insightType: string,
        urgencyLevel: 'low' | 'medium' | 'high',
        potentialSavings?: number
    ) => Promise<void>;

    trackError: (
        error: Error,
        context?: {
            component?: string;
            apiEndpoint?: string;
            userAction?: 'click' | 'view' | 'filter' | 'export' | 'refresh' | 'select' | 'analyze';
        }
    ) => Promise<void>;

    trackPerformance: (performanceData: {
        componentName: string;
        loadTime: number;
        apiEndpoint?: string;
        dataPointsCount?: number;
    }) => Promise<void>;

    trackFilterApplication: (
        filterType: string,
        filterValue: string,
        componentName: string
    ) => Promise<void>;

    trackDataExport: (
        exportType: string,
        dataRange: string,
        recordCount: number
    ) => Promise<void>;

    // Utility functions
    startTimer: () => () => number;
    measurePerformance: <T>(
        componentName: string,
        operation: () => Promise<T>,
        apiEndpoint?: string
    ) => Promise<T>;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
    const {
        userId = 'anonymous',
        enableClientSideTracking = true,
        enableServerSideTracking = true,
        enablePerformanceTracking = true,
        enableErrorTracking = true
    } = options;

    const performanceTimers = useRef<Map<string, number>>(new Map());

    // Initialize PostHog client-side tracking
    useEffect(() => {
        if (enableClientSideTracking && typeof window !== 'undefined') {
            if (!posthog.__loaded) {
                console.warn('PostHog not loaded. Make sure PostHog is initialized in your app.');
            }
        }
    }, [enableClientSideTracking]);

    // Generic event tracking
    const trackEvent = useCallback(async (
        event: DashboardEventType | string,
        properties?: AnalyticsEventProperties
    ) => {
        try {
            // Client-side tracking
            if (enableClientSideTracking && typeof window !== 'undefined' && posthog.__loaded) {
                posthog.capture(event, {
                    ...properties,
                    source: 'client',
                    user_id: userId,
                });
            }

            // Server-side tracking
            if (enableServerSideTracking) {
                await trackEventAction(event, properties, userId);
            }
        } catch (error) {
            console.error('Failed to track event:', error);
        }
    }, [userId, enableClientSideTracking, enableServerSideTracking]);

    // Page view tracking
    const trackPageView = useCallback(async (
        pagePath: string,
        properties?: AnalyticsEventProperties
    ) => {
        try {
            // Client-side tracking
            if (enableClientSideTracking && typeof window !== 'undefined' && posthog.__loaded) {
                posthog.capture('$pageview', {
                    ...properties,
                    $current_url: pagePath,
                    page_path: pagePath,
                });
            }

            // Server-side tracking
            if (enableServerSideTracking) {
                await trackPageViewAction(userId, pagePath, properties);
            }
        } catch (error) {
            console.error('Failed to track page view:', error);
        }
    }, [userId, enableClientSideTracking, enableServerSideTracking]);

    // User identification
    const identify = useCallback(async (userId: string, userProperties: AnalyticsUser) => {
        try {
            // Client-side identification
            if (enableClientSideTracking && typeof window !== 'undefined' && posthog.__loaded) {
                posthog.identify(userId, userProperties);
            }

            // Server-side identification
            if (enableServerSideTracking) {
                await identifyUserAction(userId, userProperties);
            }
        } catch (error) {
            console.error('Failed to identify user:', error);
        }
    }, [enableClientSideTracking, enableServerSideTracking]);

    // Dashboard-specific tracking functions
    const trackDashboardView = useCallback(async (properties: {
        meteringPointsCount: number;
        totalConsumption: number;
        totalCost: number;
        loadTime?: number;
        date?: string;
    }) => {
        if (enableServerSideTracking) {
            await trackDashboardViewAction(userId, properties);
        }
    }, [userId, enableServerSideTracking]);

    const trackMeteringPointInteraction = useCallback(async (
        meteringPointId: string,
        meteringPointName: string,
        actionType: 'view' | 'select' | 'analyze',
        properties?: AnalyticsEventProperties
    ) => {
        if (enableServerSideTracking) {
            await trackMeteringPointInteractionAction(userId, meteringPointId, meteringPointName, actionType, properties);
        }
    }, [userId, enableServerSideTracking]);

    const trackCostAnalysis = useCallback(async (
        meteringPointId: string,
        analysisData: {
            totalKwh: number;
            totalCost: number;
            averagePrice: number;
            peakUsageHour: number;
            potentialSavings?: number;
        }
    ) => {
        if (enableServerSideTracking) {
            await trackCostAnalysisAction(userId, meteringPointId, analysisData);
        }
    }, [userId, enableServerSideTracking]);

    const trackInsightView = useCallback(async (
        insightType: string,
        urgencyLevel: 'low' | 'medium' | 'high',
        potentialSavings?: number
    ) => {
        if (enableServerSideTracking) {
            await trackInsightViewAction(userId, insightType, urgencyLevel, potentialSavings);
        }
    }, [userId, enableServerSideTracking]);

    const trackError = useCallback(async (
        error: Error,
        context?: {
            component?: string;
            apiEndpoint?: string;
            userAction?: 'click' | 'view' | 'filter' | 'export' | 'refresh' | 'select' | 'analyze';
        }
    ) => {
        if (enableErrorTracking && enableServerSideTracking) {
            await trackErrorAction(userId, error, context);
        }
    }, [userId, enableErrorTracking, enableServerSideTracking]);

    const trackPerformance = useCallback(async (performanceData: {
        componentName: string;
        loadTime: number;
        apiEndpoint?: string;
        dataPointsCount?: number;
    }) => {
        if (enablePerformanceTracking && enableServerSideTracking) {
            await trackPerformanceAction(userId, performanceData);
        }
    }, [userId, enablePerformanceTracking, enableServerSideTracking]);

    const trackFilterApplication = useCallback(async (
        filterType: string,
        filterValue: string,
        componentName: string
    ) => {
        if (enableServerSideTracking) {
            await trackFilterApplicationAction(userId, filterType, filterValue, componentName);
        }
    }, [userId, enableServerSideTracking]);

    const trackDataExport = useCallback(async (
        exportType: string,
        dataRange: string,
        recordCount: number
    ) => {
        if (enableServerSideTracking) {
            await trackDataExportAction(userId, exportType, dataRange, recordCount);
        }
    }, [userId, enableServerSideTracking]);

    // Performance measurement utilities
    const startTimer = useCallback(() => {
        const startTime = Date.now();
        return () => Date.now() - startTime;
    }, []);

    const measurePerformance = useCallback(async <T>(
        componentName: string,
        operation: () => Promise<T>,
        apiEndpoint?: string
    ): Promise<T> => {
        const timer = startTimer();

        try {
            const result = await operation();
            const loadTime = timer();

            if (enablePerformanceTracking) {
                await trackPerformance({
                    componentName,
                    loadTime,
                    apiEndpoint,
                });
            }

            return result;
        } catch (error) {
            const loadTime = timer();

            if (enableErrorTracking && error instanceof Error) {
                await trackError(error, {
                    component: componentName,
                    apiEndpoint,
                });
            }

            throw error;
        }
    }, [startTimer, trackPerformance, trackError, enablePerformanceTracking, enableErrorTracking]);

    return {
        trackEvent,
        trackPageView,
        identify,
        trackDashboardView,
        trackMeteringPointInteraction,
        trackCostAnalysis,
        trackInsightView,
        trackError,
        trackPerformance,
        trackFilterApplication,
        trackDataExport,
        startTimer,
        measurePerformance,
    };
} 