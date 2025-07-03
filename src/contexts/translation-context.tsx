"use client"

import { translationConfig } from '@/config/translation-config'
import { Locale, TranslationContextValue } from '@/types/translation'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined)

interface TranslationProviderProps {
    children: React.ReactNode
    initialLocale?: Locale
}

interface TranslationCache {
    [key: string]: {
        translations: Record<string, any>
        timestamp: number
    }
}

export function TranslationProvider({ children, initialLocale }: TranslationProviderProps) {
    const [locale, setLocaleState] = useState<Locale>(
        initialLocale || translationConfig.defaultLocale
    )
    const [isLoading, setIsLoading] = useState(true) // Start with loading = true
    const [error, setError] = useState<Error | null>(null)
    const [cache, setCache] = useState<TranslationCache>({})
    const [hasHydrated, setHasHydrated] = useState(false)

    // Handle hydration
    useEffect(() => {
        setHasHydrated(true)
    }, [])

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale)
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferred-locale', newLocale)
            document.documentElement.lang = newLocale
        }
    }, [])

    const isCacheValid = (cached: { timestamp: number }) => {
        return Date.now() - cached.timestamp < translationConfig.cacheExpiry
    }

    const getNestedValue = (obj: any, path: string): string | undefined => {
        return path.split('.').reduce((current, key) => current?.[key], obj)
    }

    const interpolate = (template: string, values?: Record<string, any>): string => {
        if (!values) return template

        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return values[key]?.toString() || match
        })
    }

    const loadTranslations = useCallback(async (targetLocale: Locale, namespace: string = 'common') => {
        // Don't load during SSR
        if (typeof window === 'undefined') {
            return {}
        }

        const cacheKey = `${targetLocale}.${namespace}`

        if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
            return cache[cacheKey].translations
        }

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/translations/${targetLocale}/${namespace}`)
            if (!response.ok) {
                throw new Error(`Failed to fetch translations: ${response.status}`)
            }

            const data = await response.json()

            setCache(prev => ({
                ...prev,
                [cacheKey]: {
                    translations: data.translations,
                    timestamp: Date.now()
                }
            }))

            return data.translations
        } catch (err) {
            const error = err as Error
            setError(error)
            console.error(`Failed to load translations for ${targetLocale}/${namespace}:`, error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }, [cache])

    const t = useCallback((key: string, interpolations?: Record<string, any>): string => {
        // During SSR or before hydration, return the key
        if (typeof window === 'undefined' || !hasHydrated) {
            return key
        }

        // Try to find the translation in cache for common namespace first
        const commonCacheKey = `${locale}.common`
        const commonData = cache[commonCacheKey]

        if (commonData) {
            let value = getNestedValue(commonData.translations, key)

            if (value) {
                return interpolate(value, interpolations)
            }
        }

        // If not found in common, try to parse namespace from key
        const keyParts = key.split('.')
        if (keyParts.length > 1) {
            const potentialNamespace = keyParts[0]
            const restOfKey = keyParts.slice(1).join('.')
            const namespaceCacheKey = `${locale}.${potentialNamespace}`
            const namespaceData = cache[namespaceCacheKey]

            if (namespaceData) {
                let value = getNestedValue(namespaceData.translations, restOfKey)
                if (value) {
                    return interpolate(value, interpolations)
                }
            }
        }

        // If still not found, attempt to load common translations
        if (!commonData && hasHydrated) {
            loadTranslations(locale, 'common').catch(console.error)
        }

        return key
    }, [cache, locale, loadTranslations, hasHydrated])

    const refresh = useCallback(async (): Promise<void> => {
        if (typeof window === 'undefined') {
            return
        }

        setIsLoading(true)
        setError(null)
        try {
            setCache({}) // Clear cache
            await loadTranslations(locale, 'common') // Reload common translations
        } catch (err) {
            setError(err as Error)
        } finally {
            setIsLoading(false)
        }
    }, [locale, loadTranslations])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedLocale = localStorage.getItem('preferred-locale') as Locale
            if (savedLocale && translationConfig.supportedLocales.includes(savedLocale)) {
                setLocaleState(savedLocale)
                document.documentElement.lang = savedLocale
            }
        }
    }, [])

    // Load common translations when locale changes and after hydration
    useEffect(() => {
        if (hasHydrated) {
            loadTranslations(locale, 'common').catch(console.error)
        }
    }, [locale, loadTranslations, hasHydrated])

    const contextValue: TranslationContextValue = {
        locale,
        setLocale,
        t,
        isLoading: !hasHydrated || isLoading,
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