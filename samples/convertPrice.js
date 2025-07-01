const fs = require("fs");
let data = fs.readFileSync("./ibex price-data-2022-05-27 11_57_57.csv", "utf8")
data = data.split("\r\n").map(line => line.split(","))
data.shift();
data = data
    .map(line => ({
        date: new Date(line[0]),
        timestamp: new Date(line[0]).getTime(),
        price: parseFloat(line[1]),
        currency: 'BGN'
    }))
data = data
    .reduce((acc, curr) => {
        const year = curr.date.getUTCFullYear();
        const month = ('' + (curr.date.getUTCMonth() + 1)).padStart(2, '0');
        const day = ('' + curr.date.getUTCDate()).padStart(2, '0');
        const file = {
            path: `${year}/${month}`,
            file: `${day}.jsonl`
        }
        const key = JSON.stringify(file)
        acc[key] = acc[key] || []
        delete curr.date
        acc[key].push(curr)
        return acc
    }, {})
   
Object.keys(data).forEach(key => {
    const file = JSON.parse(key)
    fs.mkdirSync(`./out/${file.path}`, { recursive: true })
    fs.writeFileSync(`./out/${file.path}/${file.file}`, data[key].map(JSON.stringify).join("\n"))
});