import { translationConfig } from '@/config/translation-config';
import { getTranslations } from '@/services/translation-service';
import { Locale } from '@/types/translation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ locale: string; namespace: string }> }
) {
    try {
        const { locale, namespace } = await params

        if (!locale || !namespace) {
            return NextResponse.json(
                { error: 'Locale and namespace are required' },
                { status: 400 }
            )
        }

        if (!translationConfig.supportedLocales.includes(locale as Locale)) {
            return NextResponse.json(
                { error: `Unsupported locale: ${locale}` },
                { status: 400 }
            )
        }

        const translations = await getTranslations(locale as Locale, namespace)

        const response = NextResponse.json(translations)

        response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600')

        return response
    } catch (error) {
        console.error('Translation API error:', error)

        return NextResponse.json(
            {
                error: 'Failed to fetch translations',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
} 