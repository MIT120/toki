"use client";

import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useHydrationSafeFeatureFlag } from './use-hydration-safe';

export interface FeatureFlagOptions {
    defaultValue?: boolean;
}

export function useFeatureFlag(flagKey: string, options: FeatureFlagOptions = {}) {
    const { defaultValue = false } = options;
    const rawIsEnabled = useFeatureFlagEnabled(flagKey) ?? defaultValue;

    // Make it hydration-safe
    const isEnabled = useHydrationSafeFeatureFlag(rawIsEnabled, defaultValue);

    return {
        isEnabled,
        flagKey,
    };
} 