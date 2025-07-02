const { exec } = require('child_process');
const { calculateCostAnalysis } = require('./data/electricity-data.ts');

console.log('🧪 Testing data consistency for GCS-only implementation...\n');

// Test the same endpoint multiple times to ensure consistency
const testEndpoint = 'http://localhost:3000/api/dashboard?date=2022-04-15';

async function testConsistency() {
    const results = [];

    console.log(`📡 Testing endpoint: ${testEndpoint}`);
    console.log('🔄 Making 3 consecutive calls...\n');

    for (let i = 1; i <= 3; i++) {
        try {
            const response = await fetch(testEndpoint);
            const data = await response.json();

            if (data.success && data.data) {
                const summary = {
                    call: i,
                    totalKwh: data.data.todayData.totalKwh,
                    totalCost: data.data.todayData.totalCost,
                    averagePrice: data.data.todayData.averagePrice,
                    activeMeters: data.data.todayData.activeMeters,
                    insightsCount: data.data.recentInsights.length
                };
                results.push(summary);
                console.log(`Call ${i}:`, summary);
            } else {
                console.log(`❌ Call ${i} failed:`, data.error || 'Unknown error');
            }
        } catch (error) {
            console.log(`❌ Call ${i} error:`, error.message);
        }

        // Small delay between calls
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check consistency
    console.log('\n📊 CONSISTENCY CHECK:');
    if (results.length >= 2) {
        const first = results[0];
        const allSame = results.every(result =>
            result.totalKwh === first.totalKwh &&
            result.totalCost === first.totalCost &&
            result.averagePrice === first.averagePrice &&
            result.activeMeters === first.activeMeters &&
            result.insightsCount === first.insightsCount
        );

        if (allSame) {
            console.log('✅ SUCCESS: All calls returned identical data!');
            console.log('🎉 GCS-only implementation is working consistently');
        } else {
            console.log('❌ INCONSISTENCY DETECTED: Data differs between calls');
            console.log('🔍 This suggests there may still be randomization in the system');
        }
    } else {
        console.log('⚠️  Insufficient data to check consistency');
    }
}

// Run the test
testConsistency().catch(error => {
    console.error('Test failed:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on localhost:3000');
    console.log('Run: npm run dev');
});

console.log('🧪 === FINAL CONSISTENCY TEST ===\n');

async function testConsistency() {
    try {
        const testDate = new Date('2022-04-15'); // Known valid date
        const meteringPoints = ['1234', '5678'];

        console.log(`📅 Testing consistency for ${testDate.toISOString().split('T')[0]}`);
        console.log(`🔌 Testing meters: ${meteringPoints.join(', ')}\n`);

        // Run the same calculation 5 times
        const results = [];

        for (let i = 1; i <= 5; i++) {
            console.log(`🔄 Run ${i}:`);

            let totalKwh = 0;
            let totalCost = 0;

            for (const meterId of meteringPoints) {
                const analysis = await calculateCostAnalysis(meterId, testDate);

                if (analysis && analysis.totalKwh > 0) {
                    totalKwh += analysis.totalKwh;
                    totalCost += analysis.totalCost;
                    console.log(`   Meter ${meterId}: ${analysis.totalKwh} kWh, ${analysis.totalCost.toFixed(2)} BGN`);
                } else {
                    console.log(`   Meter ${meterId}: NO DATA`);
                }
            }

            const result = {
                run: i,
                totalKwh: Math.round(totalKwh * 100) / 100,
                totalCost: Math.round(totalCost * 100) / 100
            };

            results.push(result);
            console.log(`   TOTAL: ${result.totalKwh} kWh, ${result.totalCost} BGN\n`);
        }

        // Check consistency
        const firstResult = results[0];
        const isConsistent = results.every(r =>
            r.totalKwh === firstResult.totalKwh &&
            r.totalCost === firstResult.totalCost
        );

        console.log('📊 CONSISTENCY RESULTS:');
        console.log(`✅ All runs consistent: ${isConsistent ? 'YES' : 'NO'}`);

        if (isConsistent) {
            console.log(`🎉 SUCCESS: Data is now deterministic!`);
            console.log(`📈 Consistent values: ${firstResult.totalKwh} kWh, ${firstResult.totalCost} BGN`);
        } else {
            console.log(`❌ ISSUE: Data still varies between runs`);
            results.forEach(r => console.log(`   Run ${r.run}: ${r.totalKwh} kWh, ${r.totalCost} BGN`));
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testConsistency().catch(console.error); 