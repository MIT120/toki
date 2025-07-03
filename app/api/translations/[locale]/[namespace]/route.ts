import { translationConfig } from '@/config/translation-config';
import { Locale } from '@/types/translation';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Comprehensive path resolution for different deployment environments
function getTranslationFilePaths(locale: string, namespace: string): string[] {
    const fileName = `${namespace}.json`;

    return [
        // Local development
        path.join(process.cwd(), 'data', 'translations', locale, fileName),

        // AWS Amplify specific paths
        path.join(process.cwd(), '.next', 'standalone', 'data', 'translations', locale, fileName),
        path.join(process.cwd(), '.next', 'server', 'data', 'translations', locale, fileName),
        path.join(process.cwd(), '.next', 'server', 'chunks', 'data', 'translations', locale, fileName),

        // Amplify build artifacts
        path.join('/tmp', 'amplify', 'backend', 'data', 'translations', locale, fileName),
        path.join('/tmp', 'amplify', 'data', 'translations', locale, fileName),

        // Standard Amplify paths
        path.join('/opt', 'amplify', 'data', 'translations', locale, fileName),
        path.join('/opt', 'nodejs', 'data', 'translations', locale, fileName),

        // Vercel deployment paths (fallback)
        path.join(process.cwd(), '.next', 'standalone', 'data', 'translations', locale, fileName),
        path.join(process.cwd(), '.next', 'server', 'data', 'translations', locale, fileName),

        // Docker/containerized deployments
        path.join('/app', 'data', 'translations', locale, fileName),
        path.join('/app', '.next', 'standalone', 'data', 'translations', locale, fileName),

        // Lambda/serverless function paths
        path.join('/tmp', 'app', 'data', 'translations', locale, fileName),
        path.join('/tmp', 'data', 'translations', locale, fileName),
        path.join('/opt', 'data', 'translations', locale, fileName),

        // Alternative paths for different build configurations
        path.join(process.cwd(), 'translations', locale, fileName),
        path.join(process.cwd(), '.next', 'static', 'data', 'translations', locale, fileName),

        // AWS Lambda specific paths
        path.join('/var', 'task', 'data', 'translations', locale, fileName),
        path.join('/var', 'task', '.next', 'standalone', 'data', 'translations', locale, fileName),

        // Railway, Render, and other platform paths
        path.join('/app', '.next', 'server', 'data', 'translations', locale, fileName),
        path.join('/workspace', 'data', 'translations', locale, fileName),

        // Additional Amplify paths
        path.join('/var', 'runtime', 'data', 'translations', locale, fileName),
        path.join('/var', 'runtime', '.next', 'standalone', 'data', 'translations', locale, fileName),
    ];
}

async function loadTranslationFile(locale: string, namespace: string): Promise<{
    data: any;
    filePath: string;
} | null> {
    const possiblePaths = getTranslationFilePaths(locale, namespace);

    console.log(`🔍 Attempting to load ${locale}/${namespace} from ${possiblePaths.length} possible paths`);

    for (const filePath of possiblePaths) {
        try {
            // Check if file exists first
            if (fs.existsSync(filePath)) {
                console.log(`✅ Found translation file at: ${filePath}`);

                // Read and parse the file
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(fileContent);

                // Validate that it's a valid translation object
                if (typeof data === 'object' && data !== null) {
                    console.log(`✅ Successfully loaded and parsed translation file: ${filePath}`);
                    return { data, filePath };
                } else {
                    console.warn(`⚠️  Invalid translation format in: ${filePath}`);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Failed to load translation file ${filePath}:`, error);
            continue;
        }
    }

    // Log all attempted paths for debugging
    console.error(`❌ Translation file not found for ${locale}/${namespace}`);
    console.error(`📁 Current working directory: ${process.cwd()}`);
    console.error(`🔍 Attempted paths:`, possiblePaths);

    // Also log directory contents for debugging
    try {
        const dataDir = path.join(process.cwd(), 'data');
        if (fs.existsSync(dataDir)) {
            console.log(`📂 Contents of data directory:`, fs.readdirSync(dataDir));

            const translationsDir = path.join(dataDir, 'translations');
            if (fs.existsSync(translationsDir)) {
                console.log(`📂 Contents of translations directory:`, fs.readdirSync(translationsDir));

                const localeDir = path.join(translationsDir, locale);
                if (fs.existsSync(localeDir)) {
                    console.log(`📂 Contents of ${locale} directory:`, fs.readdirSync(localeDir));
                }
            }
        }
    } catch (debugError) {
        console.error('Debug directory listing failed:', debugError);
    }

    return null;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ locale: string; namespace: string }> }
) {
    const startTime = Date.now();

    try {
        const { locale, namespace } = await params;

        // Validate required parameters
        if (!locale || !namespace) {
            console.error('❌ Missing required parameters:', { locale, namespace });
            return NextResponse.json(
                { error: 'Locale and namespace are required' },
                { status: 400 }
            );
        }

        // Validate locale support
        if (!translationConfig.supportedLocales.includes(locale as Locale)) {
            console.error('❌ Unsupported locale:', locale);
            return NextResponse.json(
                { error: `Unsupported locale: ${locale}. Supported locales: ${translationConfig.supportedLocales.join(', ')}` },
                { status: 400 }
            );
        }

        console.log(`🔍 [${new Date().toISOString()}] Loading translations for ${locale}/${namespace}`);

        // Try to load the translation file
        const result = await loadTranslationFile(locale, namespace);

        if (!result) {
            return NextResponse.json(
                {
                    error: `Translation file not found for ${locale}/${namespace}`,
                    supportedLocales: translationConfig.supportedLocales,
                    environment: process.env.NODE_ENV || 'unknown',
                    platform: process.env.VERCEL ? 'vercel' : process.env.AWS_REGION ? 'aws' : 'unknown'
                },
                { status: 404 }
            );
        }

        const duration = Date.now() - startTime;
        console.log(`✅ Successfully loaded translations from: ${result.filePath} (${duration}ms)`);

        // Return successful response
        const response = NextResponse.json({
            locale,
            namespace,
            translations: result.data,
            version: '1.0.0',
            lastModified: new Date(),
            filePath: result.filePath,
            loadTime: duration
        });

        // Set appropriate cache headers for Amplify
        response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET');
        response.headers.set('X-Powered-By', 'Next.js + Amplify');

        return response;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Translation API error (${duration}ms):`, error);

        return NextResponse.json(
            {
                error: 'Failed to fetch translations',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'unknown',
                platform: process.env.VERCEL ? 'vercel' : process.env.AWS_REGION ? 'aws' : 'unknown'
            },
            { status: 500 }
        );
    }
} 