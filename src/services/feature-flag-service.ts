"use server";

import { PostHog } from 'posthog-node';
import { FeatureFlagUser } from '../types';
import { createFeatureFlagContext } from '../utils/feature-flag-utils';

// Reuse the PostHog client from analytics service
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

export interface FeatureFlagContext {
    userId: string;
    userEmail?: string;
    customerName?: string;
    meteringPointsCount?: number;
    userRole?: string;
    [key: string]: string | number | boolean | undefined;
}

// Helper function to check if a feature is enabled in server components/actions
export async function isFeatureEnabled(
    flagKey: string,
    userId: string,
    userProperties?: Record<string, any>
): Promise<boolean> {
    try {
        const posthog = getPostHogServer();
        const context = createFeatureFlagContext(userId, userProperties);

        const personProps: Record<string, string> = {};
        if (context.userEmail) personProps.email = context.userEmail;
        if (context.customerName) personProps.customer_name = context.customerName;
        if (context.meteringPointsCount) personProps.metering_points_count = context.meteringPointsCount.toString();
        if (context.userRole) personProps.role = context.userRole;

        const isEnabled = await posthog.isFeatureEnabled(flagKey, context.userId, {
            personProperties: personProps,
        });

        return isEnabled ?? false;
    } catch (error) {
        console.error(`Failed to check feature flag ${flagKey}:`, error);
        return false;
    }
}

export async function getFeatureFlagAction(
    flag: string,
    userId?: string,
    userProperties?: FeatureFlagUser
): Promise<{ success: boolean; enabled: boolean; error?: string }> {
    try {
        // In a real implementation, this would connect to your feature flag service
        // For now, we'll use environment variables or return default values

        const flagValue = process.env[`FEATURE_FLAG_${flag.toUpperCase()}`];

        if (flagValue !== undefined) {
            const enabled = flagValue === 'true' || flagValue === '1';
            return { success: true, enabled };
        }

        // Default feature flag values
        const defaultFlags: Record<string, boolean> = {
            'real-time-insights': true,
            'advanced-analytics': false,
            'cost-optimization': true,
            'usage-predictions': false,
            'export-data': true,
            'beta-features': false,
        };

        const enabled = defaultFlags[flag] || false;
        return { success: true, enabled };

    } catch (error) {
        console.error('Failed to get feature flag:', error);
        return {
            success: false,
            enabled: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function getAllFeatureFlagsAction(
    userId?: string,
    userProperties?: FeatureFlagUser
): Promise<{ success: boolean; flags: Record<string, boolean>; error?: string }> {
    try {
        // In a real implementation, this would fetch all flags for the user
        const flags = {
            'real-time-insights': await getFeatureFlagAction('real-time-insights', userId, userProperties),
            'advanced-analytics': await getFeatureFlagAction('advanced-analytics', userId, userProperties),
            'cost-optimization': await getFeatureFlagAction('cost-optimization', userId, userProperties),
            'usage-predictions': await getFeatureFlagAction('usage-predictions', userId, userProperties),
            'export-data': await getFeatureFlagAction('export-data', userId, userProperties),
            'beta-features': await getFeatureFlagAction('beta-features', userId, userProperties),
        };

        const flagsEnabled = Object.fromEntries(
            Object.entries(flags).map(([key, result]) => [key, result.enabled])
        );

        return { success: true, flags: flagsEnabled };

    } catch (error) {
        console.error('Failed to get all feature flags:', error);
        return {
            success: false,
            flags: {},
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
} 