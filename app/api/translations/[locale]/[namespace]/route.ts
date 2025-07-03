import { translationConfig } from '@/config/translation-config';
import { Locale } from '@/types/translation';
import { readFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ locale: string; namespace: string }> }
) {
    const startTime = Date.now();

    try {
        const { locale, namespace } = await params;

        if (!locale || !namespace) {
            return NextResponse.json(
                { error: 'Locale and namespace are required' },
                { status: 400 }
            );
        }

        if (!translationConfig.supportedLocales.includes(locale as Locale)) {
            return NextResponse.json(
                { error: `Unsupported locale: ${locale}` },
                { status: 400 }
            );
        }

        // Load translations from actual JSON files
        const translationFilePath = join(process.cwd(), 'data', 'translations', locale, `${namespace}.json`);

        let translationData;
        try {
            const fileContent = await readFile(translationFilePath, 'utf-8');
            translationData = JSON.parse(fileContent);
        } catch (fileError) {
            console.error(`Failed to load translation file: ${translationFilePath}`, fileError);
            return NextResponse.json(
                {
                    error: `Translation file not found for ${locale}/${namespace}`,
                    path: translationFilePath
                },
                { status: 404 }
            );
        }

        const duration = Date.now() - startTime;

        const response = NextResponse.json({
            locale,
            namespace,
            translations: translationData,
            version: '1.0.0',
            lastModified: new Date(),
            source: 'file',
            loadTime: duration
        });

        // Set caching headers
        response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET');

        return response;
    } catch (error) {
        console.error('Translation API error:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch translations',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
