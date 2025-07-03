import { Storage } from '@google-cloud/storage';
import path from 'path';

// For Amplify/cloud deployment, use environment variables instead of key file
const storage = new Storage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'toki-take-home',
    keyFilename: process.env.NODE_ENV === 'production' ? undefined : path.join(process.cwd(), 'toki-take-home-774e713e21c1.json'),
    credentials: process.env.NODE_ENV === 'production' ? {
        client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    } : undefined,
});

// Use the correct bucket name that we found
const BUCKET_NAME = 'toki-take-home.appspot.com';
const bucket = storage.bucket(BUCKET_NAME);

console.log(`🔗 GCS Client configured with bucket: ${BUCKET_NAME}${process.env.NODE_ENV === 'production' ? ' (using environment variables)' : ' (using key file)'}`);

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
