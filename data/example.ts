import {
    calculateCostAnalysis,
    getElectricityDataForDate,
    getMeteringPoints,
    getPricesForDate,
    getUsageForMeteringPointAndDate
} from './index';

async function demonstrateDataLayer() {
    try {
        console.log('🏪 Strahil\'s Bakery - Electricity Data Demo\n');

        const meteringPoints = await getMeteringPoints();
        console.log('📊 Available Metering Points:', meteringPoints);

        const sampleDate = new Date('2022-05-27');
        const meteringPointId = '1234';

        console.log(`\n📅 Getting data for ${sampleDate.toISOString().split('T')[0]}:`);

        const electricityData = await getElectricityDataForDate(meteringPointId, sampleDate);
        if (electricityData) {
            console.log(`⚡ Total usage records: ${electricityData.usage.length}`);
            console.log(`💵 Total price records: ${electricityData.prices.length}`);
        }

        const costAnalysis = await calculateCostAnalysis(meteringPointId, sampleDate);
        if (costAnalysis) {
            console.log('\n💡 Cost Analysis:');
            console.log(`   Total kWh: ${costAnalysis.totalKwh.toFixed(2)}`);
            console.log(`   Total Cost: ${costAnalysis.totalCost.toFixed(2)} BGN`);
            console.log(`   Average Price: ${costAnalysis.averagePrice.toFixed(4)} BGN/kWh`);
            console.log(`   Peak Usage Hour: ${costAnalysis.peakUsageHour}:00`);
            console.log(`   Peak Cost Hour: ${costAnalysis.peakCostHour}:00`);

            console.log('\n💭 Cost-Saving Suggestions:');
            costAnalysis.suggestions.forEach((suggestion, index) => {
                console.log(`   ${index + 1}. ${suggestion}`);
            });
        }

        const prices = await getPricesForDate(sampleDate);
        if (prices.length > 0) {
            const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
            const minPrice = Math.min(...prices.map(p => p.price));
            const maxPrice = Math.max(...prices.map(p => p.price));

            console.log('\n📈 Price Summary:');
            console.log(`   Average: ${avgPrice.toFixed(4)} BGN/kWh`);
            console.log(`   Min: ${minPrice.toFixed(4)} BGN/kWh`);
            console.log(`   Max: ${maxPrice.toFixed(4)} BGN/kWh`);
            console.log(`   Price Range: ${((maxPrice - minPrice) * 100).toFixed(2)}% variation`);
        }

        const usage = await getUsageForMeteringPointAndDate(meteringPointId, sampleDate);
        if (usage.length > 0) {
            const totalUsage = usage.reduce((sum, u) => sum + u.kwh, 0);
            const avgUsage = totalUsage / usage.length;
            const maxUsage = Math.max(...usage.map(u => u.kwh));

            console.log('\n⚡ Usage Summary:');
            console.log(`   Total: ${totalUsage.toFixed(2)} kWh`);
            console.log(`   Average per hour: ${avgUsage.toFixed(2)} kWh`);
            console.log(`   Peak hour usage: ${maxUsage.toFixed(2)} kWh`);
        }

    } catch (error) {
        console.error('❌ Error demonstrating data layer:', error);
    }
}

export { demonstrateDataLayer };
