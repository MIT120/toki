import { Storage } from '@google-cloud/storage';
import path from 'path';

const storage = new Storage({
    keyFilename: path.join(process.cwd(), 'toki-take-home-774e713e21c1.json'),
    projectId: 'toki-take-home'
});

// Use the correct bucket name that we found
const BUCKET_NAME = 'toki-take-home.appspot.com';
const bucket = storage.bucket(BUCKET_NAME);

console.log(`🔗 GCS Client configured with bucket: ${BUCKET_NAME}`);

export async function downloadFile(filePath: string): Promise<string> {
    try {
        console.log(`📥 Downloading: ${filePath} from bucket: ${BUCKET_NAME}`);

        const file = bucket.file(filePath);
        const [exists] = await file.exists();

        if (!exists) {
            console.log(`❌ File not found: ${filePath}`);
            throw new Error(`File not found: ${filePath}`);
        }

        const [contents] = await file.download();
        const content = contents.toString('utf-8');

        console.log(`✅ Downloaded ${content.length} characters from ${filePath}`);
        return content;

    } catch (error) {
        console.error(`💥 Error downloading ${filePath}:`, error);
        throw error;
    }
}

export async function fileExists(filePath: string): Promise<boolean> {
    try {
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        return exists;
    } catch (error) {
        console.error(`Error checking file existence: ${filePath}`, error);
        return false;
    }
}

export async function listFiles(prefix: string): Promise<string[]> {
    try {
        console.log(`📋 Listing files with prefix: ${prefix}`);

        const [files] = await bucket.getFiles({ prefix });
        const fileNames = files.map(file => file.name);

        console.log(`📊 Found ${fileNames.length} files with prefix: ${prefix}`);
        return fileNames;

    } catch (error) {
        console.error(`Error listing files with prefix ${prefix}:`, error);
        return [];
    }
}

export { bucket };
