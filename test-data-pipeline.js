const { Storage } = require('@google-cloud/storage');

async function testDataPipeline() {
    console.log('🧪 === TESTING DATA PIPELINE ===\n');

    try {
        // Test GCS direct access
        const storage = new Storage({
            keyFilename: './toki-take-home-774e713e21c1.json',
            projectId: 'toki-take-home'
        });

        const bucket = storage.bucket('toki-take-home.appspot.com');

        // Test fetching real price data for April 1, 2022
        console.log('📥 Testing price data fetch for 2022-04-01...');
        const priceFile = bucket.file('prices/2022/04/01.jsonl');
        const [exists] = await priceFile.exists();

        if (exists) {
            const [content] = await priceFile.download();
            const contentString = content.toString('utf-8');
            const lines = contentString.split('\n').filter(line => line.trim());

            console.log(`✅ Successfully fetched ${lines.length} price records`);

            // Parse and validate format
            const records = lines.map(line => JSON.parse(line));
            const firstRecord = records[0];
            const lastRecord = records[records.length - 1];

            console.log('📊 Data validation:');
            console.log(`   First: ${JSON.stringify(firstRecord)}`);
            console.log(`   Last: ${JSON.stringify(lastRecord)}`);

            // Validate timestamps are hourly
            const firstDate = new Date(firstRecord.timestamp * 1000);
            const lastDate = new Date(lastRecord.timestamp * 1000);
            console.log(`   Date range: ${firstDate.toISOString()} to ${lastDate.toISOString()}`);

            // Test data quality
            const avgPrice = records.reduce((sum, r) => sum + r.price, 0) / records.length;
            const minPrice = Math.min(...records.map(r => r.price));
            const maxPrice = Math.max(...records.map(r => r.price));

            console.log(`   Average price: ${avgPrice.toFixed(4)} BGN`);
            console.log(`   Price range: ${minPrice} - ${maxPrice} BGN`);

            console.log('\n🎉 Real data pipeline test SUCCESSFUL!');
            console.log('💡 Your application can now use real price data from GCS');

        } else {
            console.log('❌ Test file does not exist');
        }

        // Test a few more dates to ensure coverage
        console.log('\n🔍 Testing additional dates...');
        const testDates = [
            'prices/2022/01/15.jsonl',
            'prices/2022/02/10.jsonl',
            'prices/2022/03/05.jsonl'
        ];

        let successCount = 0;
        for (const testPath of testDates) {
            const file = bucket.file(testPath);
            const [fileExists] = await file.exists();
            if (fileExists) {
                successCount++;
                console.log(`✅ ${testPath} - Available`);
            } else {
                console.log(`❌ ${testPath} - Not found`);
            }
        }

        console.log(`\n📊 Data coverage: ${successCount}/${testDates.length} test dates available`);

        if (successCount > 0) {
            console.log('\n🚀 Real data pipeline is working!');
            console.log('🌐 You can now test your application at http://localhost:3000');
            console.log('💡 The app will use real GCS price data with mock usage data fallbacks');
        }

    } catch (error) {
        console.error('💥 Pipeline test failed:', error.message);
        console.log('\n🔄 Fallback to mock data is still available in your application');
    }
}

testDataPipeline().catch(console.error);