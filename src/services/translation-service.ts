import { translationConfig } from '@/config/translation-config'
import { Locale, TranslationError, TranslationNamespace } from '@/types/translation'
import fs from 'fs'
import path from 'path'

// Fallback translations loader - for when files are not accessible in runtime
const loadFallbackTranslation = async (locale: Locale, namespace: string): Promise<any> => {
    try {
        // Dynamic import for production fallback
        const translationModule = await import(`../../../data/translations/${locale}/${namespace}.json`)
        return translationModule.default || translationModule
    } catch (error) {
        console.error(`Failed to load fallback translation for ${locale}/${namespace}:`, error)

        // Try alternative import paths for different build environments
        const alternativePaths = [
            `../../data/translations/${locale}/${namespace}.json`,
            `../../../../data/translations/${locale}/${namespace}.json`,
            `./data/translations/${locale}/${namespace}.json`
        ]

        for (const altPath of alternativePaths) {
            try {
                const altModule = await import(altPath)
                return altModule.default || altModule
            } catch (altError) {
                // Continue to next path
                continue
            }
        }

        return null
    }
}

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
            // Try multiple possible paths for different deployment environments
            const possiblePaths = [
                path.join(process.cwd(), 'data', 'translations', locale, `${namespace}.json`),
                path.join(process.cwd(), '.next', 'server', 'data', 'translations', locale, `${namespace}.json`),
                path.join(process.cwd(), '.next', 'standalone', 'data', 'translations', locale, `${namespace}.json`),
                path.join(__dirname, '..', '..', '..', 'data', 'translations', locale, `${namespace}.json`),
                path.join(__dirname, '..', '..', 'data', 'translations', locale, `${namespace}.json`),
            ]

            let filePath: string | null = null
            let fileExists = false

            // Find the first existing path
            for (const possiblePath of possiblePaths) {
                if (fs.existsSync(possiblePath)) {
                    filePath = possiblePath
                    fileExists = true
                    break
                }
            }

            if (!fileExists || !filePath) {
                // Try fallback import
                console.warn(`Using fallback translation for ${locale}.${namespace}`)
                try {
                    const translations = await loadFallbackTranslation(locale, namespace)
                    if (translations) {
                        return {
                            locale,
                            namespace,
                            translations,
                            version: '1.0.0',
                            lastModified: new Date()
                        }
                    }
                } catch (fallbackError) {
                    console.error('Fallback translation import failed:', fallbackError)
                }

                // Log all attempted paths for debugging
                console.error('Translation file not found. Attempted paths:', possiblePaths)
                console.error('Current working directory:', process.cwd())
                console.error('__dirname:', __dirname)

                throw new TranslationError(
                    `Translation file not found: ${namespace}.json for locale ${locale}`,
                    'FILE_NOT_FOUND',
                    { locale, namespace, attemptedPaths: possiblePaths, cwd: process.cwd() }
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