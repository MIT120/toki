import { Locale, TranslationNamespace } from '@/types/translation'

class TranslationService {
    private cache = new Map<string, TranslationNamespace>()

    async fetchTranslations(locale: Locale, namespace: string): Promise<TranslationNamespace> {
        const cacheKey = `${locale}.${namespace}`

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!
        }

        // Fetch from API - no fallbacks, just load the actual files
        const response = await fetch(`/api/translations/${locale}/${namespace}`)

        if (!response.ok) {
            throw new Error(`Failed to fetch translations for ${locale}/${namespace}: ${response.status}`)
        }

        const translations = await response.json()
        this.cache.set(cacheKey, translations)
        return translations
    }

    async clearCache(): Promise<void> {
        this.cache.clear()
    }

    async preloadTranslations(locales: Locale[], namespaces: string[]): Promise<void> {
        const promises = locales.flatMap(locale =>
            namespaces.map(namespace => this.fetchTranslations(locale, namespace))
        )
        await Promise.all(promises)
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        }
    }
}

const translationService = new TranslationService()

export async function getTranslations(locale: Locale, namespace: string): Promise<TranslationNamespace> {
    return await translationService.fetchTranslations(locale, namespace)
}

export async function clearTranslationCache(): Promise<void> {
    return await translationService.clearCache()
}

export async function preloadTranslations(locales: Locale[], namespaces: string[]): Promise<void> {
    return await translationService.preloadTranslations(locales, namespaces)
} 