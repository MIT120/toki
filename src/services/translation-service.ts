import { translationConfig } from '@/config/translation-config'
import { Locale, TranslationError, TranslationNamespace } from '@/types/translation'
import fs from 'fs'
import path from 'path'

class TranslationService {
    private cache = new Map<string, TranslationNamespace>()
    private loadPromises = new Map<string, Promise<TranslationNamespace>>()

    async fetchTranslations(locale: Locale, namespace: string): Promise<TranslationNamespace> {
        const cacheKey = `${locale}.${namespace}`

        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey)!
            if (this.isCacheValid(cached)) {
                return cached
            }
        }

        if (this.loadPromises.has(cacheKey)) {
            return this.loadPromises.get(cacheKey)!
        }

        const loadPromise = this.loadTranslationsFromFile(locale, namespace)
        this.loadPromises.set(cacheKey, loadPromise)

        try {
            const translations = await loadPromise
            this.cache.set(cacheKey, translations)
            return translations
        } finally {
            this.loadPromises.delete(cacheKey)
        }
    }

    private async loadTranslationsFromFile(locale: Locale, namespace: string): Promise<TranslationNamespace> {
        try {
            const filePath = path.join(process.cwd(), 'data', 'translations', locale, `${namespace}.json`)

            if (!fs.existsSync(filePath)) {
                throw new TranslationError(
                    `Translation file not found: ${filePath}`,
                    'FILE_NOT_FOUND',
                    { locale, namespace, filePath }
                )
            }

            const fileContent = await fs.promises.readFile(filePath, 'utf-8')
            const translations = JSON.parse(fileContent)

            return {
                locale,
                namespace,
                translations,
                version: '1.0.0',
                lastModified: new Date()
            }
        } catch (error) {
            if (error instanceof TranslationError) {
                throw error
            }

            throw new TranslationError(
                `Failed to load translations for ${locale}/${namespace}`,
                'LOAD_ERROR',
                { locale, namespace, originalError: error }
            )
        }
    }

    private isCacheValid(cached: TranslationNamespace): boolean {
        const now = Date.now()
        const cacheTime = cached.lastModified.getTime()
        return (now - cacheTime) < translationConfig.cacheExpiry
    }

    async clearCache(): Promise<void> {
        this.cache.clear()
        this.loadPromises.clear()
    }

    async preloadTranslations(locales: Locale[], namespaces: string[]): Promise<void> {
        const promises: Promise<TranslationNamespace>[] = []

        for (const locale of locales) {
            for (const namespace of namespaces) {
                promises.push(this.fetchTranslations(locale, namespace))
            }
        }

        await Promise.allSettled(promises)
    }

    getCacheStats() {
        return {
            cacheSize: this.cache.size,
            loadingPromises: this.loadPromises.size,
            cachedKeys: Array.from(this.cache.keys())
        }
    }
}

// Export singleton instance
export const translationService = new TranslationService()

// Export helper functions for API routes
export async function getTranslations(locale: Locale, namespace: string): Promise<TranslationNamespace> {
    return translationService.fetchTranslations(locale, namespace)
}

export async function clearTranslationCache(): Promise<void> {
    return translationService.clearCache()
}

export async function preloadTranslations(locales: Locale[], namespaces: string[]): Promise<void> {
    return translationService.preloadTranslations(locales, namespaces)
} 