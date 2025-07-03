"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAnalytics } from '../hooks/use-analytics';
import { AnalyticsUser } from '../types';

interface AnalyticsContextType {
    userId: string;
    user: AnalyticsUser | null;
    isInitialized: boolean;
    analytics: ReturnType<typeof useAnalytics>;
    setUser: (user: AnalyticsUser) => void;
    setUserId: (userId: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
    children: React.ReactNode;
    initialUserId?: string;
    initialUser?: AnalyticsUser;
    enableClientSideTracking?: boolean;
    enableServerSideTracking?: boolean;
    enablePerformanceTracking?: boolean;
    enableErrorTracking?: boolean;
}

export function AnalyticsProvider({
    children,
    initialUserId = 'anonymous',
    initialUser,
    enableClientSideTracking = true,
    enableServerSideTracking = true,
    enablePerformanceTracking = true,
    enableErrorTracking = true,
}: AnalyticsProviderProps) {
    const [userId, setUserId] = useState(initialUserId);
    const [user, setUserState] = useState<AnalyticsUser | null>(initialUser || null);
    const [isInitialized, setIsInitialized] = useState(false);

    const analytics = useAnalytics({
        userId,
        enableClientSideTracking,
        enableServerSideTracking,
        enablePerformanceTracking,
        enableErrorTracking,
    });

    // Initialize analytics when component mounts
    useEffect(() => {
        const initializeAnalytics = async () => {
            try {
                // If we have initial user data, identify the user
                if (initialUser && userId !== 'anonymous') {
                    await analytics.identify(userId, initialUser);
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize analytics:', error);
                setIsInitialized(true); // Still mark as initialized to prevent blocking
            }
        };

        initializeAnalytics();
    }, [analytics, userId, initialUser]);

    // Set user and identify them with analytics
    const setUser = async (newUser: AnalyticsUser) => {
        setUserState(newUser);

        if (newUser.id !== userId) {
            setUserId(newUser.id);
        }

        try {
            await analytics.identify(newUser.id, newUser);
        } catch (error) {
            console.error('Failed to identify user:', error);
        }
    };

    // Update user ID and re-identify if we have user data
    const handleSetUserId = async (newUserId: string) => {
        setUserId(newUserId);

        if (user && newUserId !== 'anonymous') {
            try {
                await analytics.identify(newUserId, { ...user, id: newUserId });
            } catch (error) {
                console.error('Failed to re-identify user:', error);
            }
        }
    };

    const value: AnalyticsContextType = {
        userId,
        user,
        isInitialized,
        analytics,
        setUser,
        setUserId: handleSetUserId,
    };

    return (
        <AnalyticsContext.Provider value={value}>
            {children}
        </AnalyticsContext.Provider>
    );
}

export function useAnalyticsContext(): AnalyticsContextType {
    const context = useContext(AnalyticsContext);
    if (context === undefined) {
        throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
    }
    return context;
}

// Convenience hook that combines analytics context with common patterns
export function useDashboardAnalytics() {
    const { analytics, userId, user, isInitialized } = useAnalyticsContext();

    // Auto-track page views with user context
    const trackPageViewWithContext = React.useCallback(async (pagePath: string) => {
        if (!isInitialized) return;

        await analytics.trackPageView(pagePath, {
            user_id: userId,
            customer_name: user?.customerName,
            metering_points_count: user?.meteringPointsCount,
        });
    }, [analytics, userId, user, isInitialized]);

    // Auto-track dashboard views with enhanced context
    const trackDashboardViewWithContext = React.useCallback(async (properties: {
        meteringPointsCount: number;
        totalConsumption: number;
        totalCost: number;
        loadTime?: number;
        date?: string;
    }) => {
        if (!isInitialized) return;

        await analytics.trackDashboardView({
            ...properties,
            // Add user context
        });
    }, [analytics, isInitialized]);

    // Auto-track errors with user context
    const trackErrorWithContext = React.useCallback(async (
        error: Error,
        context?: {
            component?: string;
            apiEndpoint?: string;
            userAction?: 'click' | 'view' | 'filter' | 'export' | 'refresh' | 'select' | 'analyze';
        }
    ) => {
        if (!isInitialized) return;

        await analytics.trackError(error, {
            ...context,
            // Add user context for better debugging
        });
    }, [analytics, isInitialized]);

    return {
        ...analytics,
        trackPageViewWithContext,
        trackDashboardViewWithContext,
        trackErrorWithContext,
        userId,
        user,
        isInitialized,
    };
} 