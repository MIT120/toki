"use client"

import { translationConfig } from '@/config/translation-config'
import { useLocale } from '@/contexts/translation-context'
import { TranslationHookReturn } from '@/types/translation'
import { useCallback, useEffect, useState } from 'react'

interface TranslationCache {
    [key: string]: {
        translations: Record<string, any>
        timestamp: number
    }
}

export function useTranslation(namespace: string = 'common'): TranslationHookReturn {
    const { locale, setLocale } = useLocale()
    const [cache, setCache] = useState<TranslationCache>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const cacheKey = `${locale}.${namespace}`

    const fetchTranslations = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            if (cache[cacheKey] && isCacheValid(cache[cacheKey])) {
                setIsLoading(false)
                return
            }

            const response = await fetch(`/api/translations/${locale}/${namespace}`)
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
        } catch (err) {
            setError(err as Error)
            console.error(`Failed to load translations for ${locale}/${namespace}:`, err)
        } finally {
            setIsLoading(false)
        }
    }, [locale, namespace, cacheKey, cache])

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

    const t = useCallback((key: string, interpolations?: Record<string, any>): string => {
        const cachedData = cache[cacheKey]
        if (!cachedData) {
            throw new Error(`Translations not loaded for ${locale}.${namespace}`)
        }

        const value = getNestedValue(cachedData.translations, key)

        if (!value) {
            throw new Error(`Translation missing: ${locale}.${namespace}.${key}`)
        }

        return interpolate(value, interpolations)
    }, [cache, cacheKey, locale, namespace])

    const refresh = useCallback(async () => {
        setCache(prev => {
            const updated = { ...prev }
            delete updated[cacheKey]
            return updated
        })
        await fetchTranslations()
    }, [cacheKey, fetchTranslations])

    useEffect(() => {
        fetchTranslations()
    }, [fetchTranslations])

    return {
        t,
        locale,
        setLocale,
        isLoading,
        error,
        refresh
    }
} 