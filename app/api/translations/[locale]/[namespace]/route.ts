import { translationConfig } from '@/config/translation-config';
import { Locale } from '@/types/translation';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

// Build-time paths only - translations are built into .next folder
function getTranslationFilePaths(locale: string, namespace: string): string[] {
    const fileName = `${namespace}.json`;

    return [
        // AWS Amplify runtime paths (built output)
        path.join(process.cwd(), '.next', 'standalone', 'data', 'translations', locale, fileName),
        path.join(process.cwd(), '.next', 'server', 'data', 'translations', locale, fileName),
        path.join(process.cwd(), '.next', 'data', 'translations', locale, fileName),

        // Additional Amplify runtime paths
        path.join('/opt', 'amplify', '.next', 'standalone', 'data', 'translations', locale, fileName),
        path.join('/var', 'runtime', '.next', 'standalone', 'data', 'translations', locale, fileName),
        path.join('/tmp', 'amplify', '.next', 'standalone', 'data', 'translations', locale, fileName),

        // Docker/containerized runtime paths
        path.join('/app', '.next', 'standalone', 'data', 'translations', locale, fileName),
        path.join('/app', '.next', 'server', 'data', 'translations', locale, fileName),

        // Lambda runtime paths
        path.join('/var', 'task', '.next', 'standalone', 'data', 'translations', locale, fileName),
        path.join('/var', 'task', '.next', 'server', 'data', 'translations', locale, fileName),

        // Development fallback (only for local testing)
        path.join(process.cwd(), 'data', 'translations', locale, fileName),
    ];
}

async function loadTranslationFile(locale: string, namespace: string): Promise<{
    data: any;
    filePath: string;
} | null> {
    const possiblePaths = getTranslationFilePaths(locale, namespace);

    console.log(`🔍 [RUNTIME] Loading ${locale}/${namespace} from ${possiblePaths.length} build paths`);
    console.log(`📁 Working directory: ${process.cwd()}`);

    for (const filePath of possiblePaths) {
        try {
            if (fs.existsSync(filePath)) {
                console.log(`✅ Found translation file at: ${filePath}`);

                const fileContent = fs.readFileSync(filePath, 'utf-8');
                const data = JSON.parse(fileContent);

                if (typeof data === 'object' && data !== null) {
                    console.log(`✅ Successfully loaded translation file: ${filePath}`);
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

    console.error(`❌ Translation file not found for ${locale}/${namespace}`);
    console.error(`🔍 Tried paths:`, possiblePaths);

    // Debug built directory structure
    try {
        const nextDir = path.join(process.cwd(), '.next');
        if (fs.existsSync(nextDir)) {
            console.log(`📂 .next directory exists`);

            const standaloneDir = path.join(nextDir, 'standalone');
            if (fs.existsSync(standaloneDir)) {
                console.log(`📂 .next/standalone exists`);
                console.log(`📁 Contents:`, fs.readdirSync(standaloneDir));

                const dataDir = path.join(standaloneDir, 'data');
                if (fs.existsSync(dataDir)) {
                    console.log(`📂 .next/standalone/data exists`);
                    console.log(`📁 Contents:`, fs.readdirSync(dataDir));
                }
            }
        }
    } catch (debugError) {
        console.error('Debug failed:', debugError);
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

        if (!locale || !namespace) {
            console.error('❌ Missing required parameters:', { locale, namespace });
            return NextResponse.json(
                { error: 'Locale and namespace are required' },
                { status: 400 }
            );
        }

        if (!translationConfig.supportedLocales.includes(locale as Locale)) {
            console.error('❌ Unsupported locale:', locale);
            return NextResponse.json(
                { error: `Unsupported locale: ${locale}. Supported locales: ${translationConfig.supportedLocales.join(', ')}` },
                { status: 400 }
            );
        }

        console.log(`🔍 [${new Date().toISOString()}] RUNTIME: Loading translations for ${locale}/${namespace}`);

        const result = await loadTranslationFile(locale, namespace);

        if (!result) {
            return NextResponse.json(
                {
                    error: `Translation file not found for ${locale}/${namespace}`,
                    supportedLocales: translationConfig.supportedLocales,
                    environment: process.env.NODE_ENV || 'unknown',
                    platform: process.env.AWS_REGION ? 'aws' : 'unknown',
                    workingDir: process.cwd()
                },
                { status: 404 }
            );
        }

        const duration = Date.now() - startTime;
        console.log(`✅ RUNTIME: Successfully loaded translations from: ${result.filePath} (${duration}ms)`);

        const response = NextResponse.json({
            locale,
            namespace,
            translations: result.data,
            version: '1.0.0',
            lastModified: new Date(),
            filePath: result.filePath,
            loadTime: duration
        });

        response.headers.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET');
        response.headers.set('X-Powered-By', 'Next.js + Amplify');

        return response;
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ RUNTIME Translation API error (${duration}ms):`, error);

        return NextResponse.json(
            {
                error: 'Failed to fetch translations',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'unknown',
                platform: process.env.AWS_REGION ? 'aws' : 'unknown'
            },
            { status: 500 }
        );
    }
} 