const fs = require('fs');
['1234', '5678'].forEach((key) => {
    for (let day = 1; day < 31; day++) {
        const data = new Array(24).fill(0).map((_, idx) => ({
            timestamp: Date.UTC(2022, 3, day, idx, 0, 0),
            kwh: Math.random() * 100,
        }));
        fs.mkdirSync(`./out/2022/04/${day}`, { recursive: true });
        fs.writeFileSync(`./out/2022/04/${day}/${key}.jsonl`, data.map(JSON.stringify).join('\n'));
    }
});
