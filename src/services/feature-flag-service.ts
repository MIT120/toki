"use server";

import { PostHog } from 'posthog-node';
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