import { translationConfig } from '@/config/translation-config'
import { Locale, TranslationError, TranslationNamespace } from '@/types/translation'
import fs from 'fs'
import path from 'path'

// Fallback translations loader - for when files are not accessible in runtime
const loadFallbackTranslation = async (locale: Locale, namespace: string): Promise<any> => {
    try {
        // For production environments, use absolute imports from the data directory
        // This path should work in most Next.js build environments
        const translationModule = await import(`../../../data/translations/${locale}/${namespace}.json`)
        return translationModule.default || translationModule
    } catch (error) {
        console.error(`Failed to load fallback translation for ${locale}/${namespace}:`, error)

        // If dynamic import fails, use hardcoded fallback
        return await loadHardcodedFallback(locale, namespace)
    }
}

// Hardcoded fallback for critical translations
const loadHardcodedFallback = async (locale: Locale, namespace: string): Promise<any> => {
    // Return basic fallback translations for critical namespaces
    const fallbackTranslations: Record<string, any> = {
        common: {
            buttons: {
                refresh: locale === 'en' ? 'Refresh' : 'Обнови',
                export: locale === 'en' ? 'Export' : 'Експорт',
                save: locale === 'en' ? 'Save' : 'Запиши',
                cancel: locale === 'en' ? 'Cancel' : 'Отказ',
                confirm: locale === 'en' ? 'Confirm' : 'Потвърди',
                delete: locale === 'en' ? 'Delete' : 'Изтрий',
                edit: locale === 'en' ? 'Edit' : 'Редактирай',
                view: locale === 'en' ? 'View' : 'Преглед',
                loadMore: locale === 'en' ? 'Load More' : 'Зареди още',
                retry: locale === 'en' ? 'Retry' : 'Опитай отново'
            },
            labels: {
                loading: locale === 'en' ? 'Loading...' : 'Зареждане...',
                noData: locale === 'en' ? 'No Data Available' : 'Няма налични данни',
                error: locale === 'en' ? 'Error' : 'Грешка',
                success: locale === 'en' ? 'Success' : 'Успех',
                warning: locale === 'en' ? 'Warning' : 'Предупреждение',
                info: locale === 'en' ? 'Information' : 'Информация',
                language: locale === 'en' ? 'Language' : 'Език',
                lastUpdated: locale === 'en' ? 'Last updated' : 'Последно обновено',
                searchPlaceholder: locale === 'en' ? 'Search...' : 'Търси...'
            },
            units: {
                kWh: 'kWh',
                bgn: 'BGN',
                hours: locale === 'en' ? 'hours' : 'часа',
                minutes: locale === 'en' ? 'minutes' : 'минути',
                percent: '%',
                bgnPerKwh: 'BGN/kWh'
            }
        },
        charts: {
            labels: {
                consumption: locale === 'en' ? 'Consumption' : 'Потребление',
                cost: locale === 'en' ? 'Cost' : 'Стойност',
                time: locale === 'en' ? 'Time' : 'Време',
                noData: locale === 'en' ? 'No data available' : 'Няма налични данни',
                hourlyConsumption: locale === 'en' ? 'Hourly Consumption' : 'Почасово потребление',
                totalCost: locale === 'en' ? 'Total Cost' : 'Обща стойност'
            }
        },
        dashboard: {
            title: locale === 'en' ? 'Dashboard' : 'Табло',
            labels: {
                overview: locale === 'en' ? 'Overview' : 'Преглед',
                totalConsumption: locale === 'en' ? 'Total Consumption' : 'Общо потребление',
                totalCost: locale === 'en' ? 'Total Cost' : 'Обща стойност',
                averageConsumption: locale === 'en' ? 'Average Consumption' : 'Средно потребление',
                peakConsumption: locale === 'en' ? 'Peak Consumption' : 'Пиково потребление'
            }
        },
        tables: {
            headers: {
                date: locale === 'en' ? 'Date' : 'Дата',
                consumption: locale === 'en' ? 'Consumption' : 'Потребление',
                cost: locale === 'en' ? 'Cost' : 'Стойност',
                time: locale === 'en' ? 'Time' : 'Време'
            },
            actions: {
                view: locale === 'en' ? 'View' : 'Преглед',
                export: locale === 'en' ? 'Export' : 'Експорт'
            }
        },
        errors: {
            general: locale === 'en' ? 'An error occurred' : 'Възникна грешка',
            network: locale === 'en' ? 'Network connection error' : 'Грешка в мрежовата връзка',
            notFound: locale === 'en' ? 'Data not found' : 'Данните не са намерени',
            serverError: locale === 'en' ? 'Server error' : 'Сървърна грешка'
        },
        navigation: {
            menu: {
                dashboard: locale === 'en' ? 'Dashboard' : 'Табло',
                analytics: locale === 'en' ? 'Analytics' : 'Анализи',
                settings: locale === 'en' ? 'Settings' : 'Настройки'
            }
        },
        filters: {
            dates: {
                today: locale === 'en' ? 'Today' : 'Днес',
                yesterday: locale === 'en' ? 'Yesterday' : 'Вчера',
                thisWeek: locale === 'en' ? 'This Week' : 'Тази седмица',
                thisMonth: locale === 'en' ? 'This Month' : 'Този месец'
            }
        },
        analytics: {
            insights: {
                title: locale === 'en' ? 'Insights' : 'Анализи',
                consumption: locale === 'en' ? 'Consumption Analysis' : 'Анализ на потреблението',
                cost: locale === 'en' ? 'Cost Analysis' : 'Анализ на разходите'
            }
        },
        insights: {
            recommendations: {
                title: locale === 'en' ? 'Recommendations' : 'Препоръки',
                optimize: locale === 'en' ? 'Optimize Usage' : 'Оптимизирай употребата'
            }
        },
        analysis: {
            title: locale === 'en' ? 'Analysis' : 'Анализ',
            costBreakdown: locale === 'en' ? 'Cost Breakdown' : 'Разбивка на разходите',
            consumptionTrends: locale === 'en' ? 'Consumption Trends' : 'Тенденции в потреблението'
        },
        page: {
            title: locale === 'en' ? 'Electricity Data' : 'Електрически данни',
            description: locale === 'en' ? 'View and analyze your electricity consumption' : 'Преглед и анализ на вашето електропотребление'
        }
    }

    return fallbackTranslations[namespace] || {}
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
                try {
                    if (fs.existsSync(possiblePath)) {
                        filePath = possiblePath
                        fileExists = true
                        break
                    }
                } catch (error) {
                    // Continue to next path if fs access fails
                    continue
                }
            }

            if (!fileExists || !filePath) {
                // Try fallback import
                console.warn(`Using fallback translation for ${locale}.${namespace}`)
                try {
                    const translations = await loadFallbackTranslation(locale, namespace)
                    if (translations && Object.keys(translations).length > 0) {
                        return {
                            locale,
                            namespace,
                            translations,
                            version: '1.0.0-fallback',
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