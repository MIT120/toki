export const DATA_CONFIG = {
    GCS: {
        bucketName: 'toki-take-home-data',
        projectId: 'toki-take-home',
        keyFilename: './toki-take-home-774e713e21c1.json'
    },
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