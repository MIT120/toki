export const DATA_CONFIG = {
    GCS: {
        enabled: false,
        bucketName: 'toki-take-home-data',
        keyFilename: './toki-take-home-774e713e21c1.json',
        projectId: 'toki-take-home'
    },
    DEMO_MODE: true,
    DEFAULT_CURRENCY: 'BGN',
    TIMEZONE: 'Europe/Sofia',
    PATHS: {
        prices: 'prices',
        usage: 'usage'
    },
    CACHE: {
        enableCaching: false,
        cacheExpiryMinutes: 30
    },
    LIMITS: {
        maxConcurrentRequests: 5,
        maxDateRangeDays: 90
    }
} as const;

export type DataConfig = typeof DATA_CONFIG; 