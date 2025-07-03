import { TranslationConfig } from '@/types/translation'

export const translationConfig: TranslationConfig = {
    defaultLocale: 'en',
    supportedLocales: ['en', 'bg'],
    cacheExpiry: 1000 * 60 * 30, // 30 minutes
}

export const namespaceMapping = {
    common: ['buttons', 'labels', 'messages', 'units', 'status'],
    dashboard: ['metrics', 'overview', 'actions'],
    analytics: ['insights', 'calculations', 'reports'],
    charts: ['titles', 'labels', 'tooltips'],
    tables: ['headers', 'actions', 'empty'],
    errors: ['validation', 'api', 'general'],
    navigation: ['menu', 'breadcrumbs'],
    filters: ['dates', 'options', 'placeholders'],
} as const

export type TranslationNamespace = keyof typeof namespaceMapping

export const localeNames = {
    en: 'English',
    bg: 'Български',
} as const 