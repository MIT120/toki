"use client";

import { useEffect, useState } from 'react';

export function useIsHydrated() {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    return isHydrated;
}

export function useHydrationSafeFeatureFlag(
    flagValue: boolean,
    fallback: boolean = false
) {
    const isHydrated = useIsHydrated();
    return isHydrated ? flagValue : fallback;
} 