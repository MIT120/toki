const points = [
    '111111',
    '111112',
    '111113',
    '111114',
    '111115',
]
const csv = [];
points.forEach(pointId => {
    const curr = new Date(2022, 3, 1)
    while (curr.getMonth() === 3) {
        if (pointId === '111112' && curr.getDate() > 17) {
            break;
        }
        const data = {
            pointId,
            timestamp: curr.getTime(),
            value: Math.random() * 100
        }
        csv.push(data)
        curr.setHours(curr.getHours() + 1)
    }
})

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

shuffle(csv).forEach(data => {
    if (data.pointId === '111114' && (data.timestamp > 1649556000000 && data.timestamp < 1649779200000)) {
        console.log(`${data.pointId},${data.timestamp}${data.value}`)
    } else {
        console.log(`${data.pointId},${data.timestamp},${data.value}`)
    }
})