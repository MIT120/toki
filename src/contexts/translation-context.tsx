"use client"

import { translationConfig } from '@/config/translation-config'
import { Locale, TranslationContextValue } from '@/types/translation'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined)

interface TranslationProviderProps {
    children: React.ReactNode
    initialLocale?: Locale
}

export function TranslationProvider({ children, initialLocale }: TranslationProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(
        initialLocale || translationConfig.defaultLocale
    )
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale)
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred-locale', newLocale)
            document.documentElement.lang = newLocale
        }
    }, [])

    const t = useCallback((key: string, interpolations?: Record<string, any>): string => {
        return key
    }, [])

    const refresh = useCallback(async (): Promise<void> => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/translations/refresh`, { method: 'POST' })
            if (!response.ok) {
                throw new Error('Failed to refresh translations')
            }
            window.location.reload()
        } catch (err) {
            setError(err as Error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLocale = localStorage.getItem('preferred-locale') as Locale
            if (savedLocale && translationConfig.supportedLocales.includes(savedLocale)) {
                setLocaleState(savedLocale)
                document.documentElement.lang = savedLocale
            }
        }
    }, [])

    const contextValue: TranslationContextValue = {
        locale,
        setLocale,
        t,
        isLoading,
        error,
        refresh
    }

    return (
        <TranslationContext.Provider value={contextValue}>
            {children}
        </TranslationContext.Provider>
    )
}

export function useTranslationContext() {
    const context = useContext(TranslationContext)
    if (context === undefined) {
        throw new Error('useTranslationContext must be used within a TranslationProvider')
    }
    return context
}

export function useLocale() {
    const { locale, setLocale } = useTranslationContext()
    return { locale, setLocale }
} 