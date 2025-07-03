import { translationConfig } from '@/config/translation-config';
import { Locale } from '@/types/translation';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

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

        // Try multiple possible paths for different deployment environments
        const possiblePaths = [
            // Standard development path
            path.join(process.cwd(), 'data', 'translations', locale, `${namespace}.json`),
            // Production serverless paths
            path.join(process.cwd(), '.next', 'standalone', 'data', 'translations', locale, `${namespace}.json`),
            path.join(process.cwd(), '.next', 'standalone', 'translations', locale, `${namespace}.json`),
            // Additional serverless paths
            path.join('/tmp/app', 'data', 'translations', locale, `${namespace}.json`),
            path.join('/tmp/app', '.next', 'standalone', 'data', 'translations', locale, `${namespace}.json`),
            path.join('/tmp/app', '.next', 'standalone', 'translations', locale, `${namespace}.json`),
        ]

        let translationData = null
        let filePath = null

        // Find the first existing file
        for (const possiblePath of possiblePaths) {
            try {
                if (fs.existsSync(possiblePath)) {
                    const fileContent = fs.readFileSync(possiblePath, 'utf-8')
                    translationData = JSON.parse(fileContent)
                    filePath = possiblePath
                    break
                }
            } catch (error) {
                // Continue to next path if this one fails
                continue
            }
        }

        if (!translationData) {
            return NextResponse.json(
                { error: `Translation file not found for ${locale}/${namespace}` },
                { status: 404 }
            )
        }

        // Return the translation data with metadata
        const response = NextResponse.json({
            locale,
            namespace,
            translations: translationData,
            version: '1.0.0',
            lastModified: new Date()
        })

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