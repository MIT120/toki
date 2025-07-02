'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
            if (posthogKey && !posthog.__loaded) {
                posthog.init(posthogKey, {
                    api_host: '/ingest',
                    ui_host: 'https://us.posthog.com',
                    capture_pageview: true,
                    capture_pageleave: true,
                    debug: process.env.NODE_ENV === 'development',
                    loaded: (posthog) => {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('PostHog loaded')
                        }
                    }
                })
            }
        }
    }, [])

    if (typeof window === 'undefined') {
        return <>{children}</>
    }

    return <PHProvider client={posthog}>{children}</PHProvider>
} 