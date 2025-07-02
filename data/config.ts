export const DATA_CONFIG = {
    GCS: {
        enabled: true,
        bucketName: 'toki-take-home.appspot.com',
        keyFilename: './toki-take-home-774e713e21c1.json',
        projectId: 'toki-take-home'
    },
    DEMO_MODE: false,
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