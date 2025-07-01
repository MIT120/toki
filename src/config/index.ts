import { Config } from '@/types';
import dotenv from 'dotenv';

dotenv.config();

export const config: Config = {
    pricesApiUrl: process.env.PRICES_API_URL || 'https://us-central1-toki-take-home.cloudfunctions.net/prices',
    dataStoragePath: process.env.DATA_STORAGE_PATH || './data',
    outputPath: process.env.OUTPUT_PATH || './output',
    currency: process.env.CURRENCY || 'EUR',
    timezone: process.env.TIMEZONE || 'Europe/Sofia',
};

export const firebaseConfig = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'toki-take-home',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'toki-take-home.appspot.com',
};

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development'; 