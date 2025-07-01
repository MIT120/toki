import { Storage } from '@google-cloud/storage';
import { DATA_CONFIG } from './config';

let storage: Storage | null = null;

export function getGCSClient(): Storage {
    if (!storage) {
        storage = new Storage({
            keyFilename: DATA_CONFIG.GCS.keyFilename,
            projectId: DATA_CONFIG.GCS.projectId
        });
    }

    return storage;
}

export function getBucket() {
    const client = getGCSClient();
    return client.bucket(DATA_CONFIG.GCS.bucketName);
}

export async function downloadFile(filePath: string): Promise<string> {
    try {
        const bucket = getBucket();
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (!exists) {
            throw new Error(`File not found: ${filePath}`);
        }

        const [content] = await file.download();
        return content.toString('utf-8');
    } catch (error) {
        throw new Error(`Failed to download file ${filePath}: ${error}`);
    }
}

export function parseJsonLines<T>(content: string): T[] {
    const lines = content.trim().split('\n').filter(line => line.trim());
    const results: T[] = [];

    for (const line of lines) {
        try {
            const parsed = JSON.parse(line) as T;
            results.push(parsed);
        } catch (error) {
            console.warn(`Failed to parse JSON line: ${line}`, error);
        }
    }

    return results;
}

export function formatDatePath(date: Date): { year: string; month: string; day: string } {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return { year, month, day };
} 