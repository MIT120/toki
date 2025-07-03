export type Locale = 'en' | 'bg'

export interface TranslationNamespace {
    locale: Locale
    namespace: string
    translations: Record<string, any>
    version: string
    lastModified: Date
}

export interface TranslationConfig {
    defaultLocale: Locale
    fallbackLocale: Locale
    supportedLocales: Locale[]
    cacheExpiry: number
}

export interface TranslationContextValue {
    locale: Locale
    setLocale: (locale: Locale) => void
    t: (key: string, interpolations?: Record<string, any>) => string
    isLoading: boolean
    error: Error | null
    refresh: () => Promise<void>
}

export interface TranslationHookReturn {
    t: (key: string, interpolations?: Record<string, any>) => string
    locale: Locale
    setLocale: (locale: Locale) => void
    isLoading: boolean
    error: Error | null
    refresh: () => Promise<void>
}

export class TranslationError extends Error {
    constructor(
        message: string,
        public code: string,
        public context?: Record<string, any>
    ) {
        super(message)
        this.name = 'TranslationError'
    }
} 