import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import { AnalyticsProvider } from '../src/contexts/analytics-context'
import { TranslationProvider } from '../src/contexts/translation-context'
import { QueryProvider } from '../src/providers/query-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Toki Dashboard',
    description: 'Data processing and analytics dashboard',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <TranslationProvider>
                    <QueryProvider>
                        <AnalyticsProvider
                            initialUserId="user-123"
                            initialUser={{
                                id: "user-123",
                                name: "Strahil",
                                email: "strahil@bakery.com",
                                role: "owner",
                                customerName: "My Amazing Bakery EOOD",
                                meteringPointsCount: 3
                            }}
                            enableClientSideTracking={true}
                            enableServerSideTracking={true}
                            enablePerformanceTracking={true}
                            enableErrorTracking={true}
                        >
                            {children}
                        </AnalyticsProvider>
                    </QueryProvider>
                </TranslationProvider>
            </body>
        </html>
    )
} 