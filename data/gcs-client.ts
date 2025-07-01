import { Storage } from '@google-cloud/storage';
import { DATA_CONFIG } from './config';

let storage: Storage | null = null;

export function getGCSClient(): Storage {
    if (!storage && DATA_CONFIG.GCS.enabled) {
        storage = new Storage({
            keyFilename: DATA_CONFIG.GCS.keyFilename,
            projectId: DATA_CONFIG.GCS.projectId
        });
    }
    return storage!;
}

export function getBucket() {
    if (!DATA_CONFIG.GCS.enabled) {
        return null;
    }
    const client = getGCSClient();
    return client.bucket(DATA_CONFIG.GCS.bucketName);
}

export async function downloadFile(filePath: string): Promise<string> {
    // If GCS is disabled or in demo mode, return empty string immediately
    if (!DATA_CONFIG.GCS.enabled || DATA_CONFIG.DEMO_MODE) {
        console.log(`GCS disabled or demo mode - using mock data for: ${filePath}`);
        return '';
    }

    try {
        const bucket = getBucket();
        if (!bucket) {
            return '';
        }

        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (!exists) {
            console.warn(`File not found: ${filePath}`);
            return '';
        }

        const [content] = await file.download();
        return content.toString('utf-8');
    } catch (error) {
        console.warn(`Failed to download file ${filePath}:`, error);
        return '';
    }
}

export function parseJsonLines<T>(content: string): T[] {
    if (!content || content.trim() === '') {
        return [];
    }

    try {
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line) as T);
    } catch (error) {
        console.warn('Failed to parse JSON Lines data:', error);
        return [];
    }
}

export function formatDatePath(date: Date): { year: string; month: string; day: string } {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return { year, month, day };
} 