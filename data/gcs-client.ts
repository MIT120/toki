import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucketName = 'your-bucket-name'; // Replace with your actual bucket name

export function getGCSClient(): Storage {
    return storage;
}

export function getBucket() {
    return storage.bucket(bucketName);
}

export async function downloadFile(filePath: string): Promise<string> {
    try {
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filePath);

        const [exists] = await file.exists();
        if (!exists) {
            console.warn(`File not found: ${filePath}`);
            return ''; // Return empty string instead of throwing error
        }

        const [content] = await file.download();
        return content.toString('utf-8');
    } catch (error) {
        console.warn(`Failed to download file ${filePath}:`, error);
        return ''; // Return empty string instead of throwing error
    }
}

export function parseJsonLines<T>(content: string): T[] {
    if (!content || content.trim() === '') {
        return []; // Return empty array for missing data
    }

    try {
        return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => JSON.parse(line) as T);
    } catch (error) {
        console.warn('Failed to parse JSON Lines data:', error);
        return []; // Return empty array for invalid data
    }
}

export function formatDatePath(date: Date): { year: string; month: string; day: string } {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    return { year, month, day };
} 