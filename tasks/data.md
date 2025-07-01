# TOKI Take Home Data Challenge

As a trader of electricity, Toki needs to issue invoices for the electricity consumption of the customers. This process happens once a month and is based on the consumption of electricity for the month. The price of electricity is dynamic and it is defined by the energy exchange. We can assume we want to do that for millions of users in the future and we also want to run business analysis on the data to make pricing decisions. Another important point is that this needs to be designed for the cloud, since we don't want to manage local resources.

## Your task

Calculate ( and optionally produce) invoices for each metering point for the current month. The invoice should contain total amount of energy consumed, the average price for the month and the final amount.

### Data sources

#### Prices

Prices for each hour are retrieved through an API. By a given date the API returns a JSON array of numbers. The array contains 24 elements for each hour. Here is an example request:

```sh
curl https://us-central1-toki-take-home.cloudfunctions.net/prices/2022-05-01
```

Response:

```json
[
  134.23, 432.12, 48, 101.01, 365, 119, 328, 75, 203, 196, 167, 92, 104, 122,
  184, 274, 388, 63, 309, 312, 308
]
```

#### Usage data

The usage per hour for each metering point comes in a form of a `csv` file. The file can send to you over email, uploaded to a cloud storage somewhere, the point is that it comes from a human using standard for humans ways. It is ok for you to define where you would need to file to be uploaded/stored. Sample file can be found here [data.csv](./data.csv)
Format:

```csv
metering_point_id,timestamp,kwh
12345,1649401200,4.2134
...
```

## Helpful tips and nice to haves

We would like to play around with your solution. There’s a bunch of good practices you can use to make that easier for us:

1. Make sure the code has helpful comments wherever it’s not self-documenting 💁‍♂️
2. Make it easy to spin things up for development or testing 👩‍💻
3. If there’s tricky logic that we might miss when playing with the code, protect it with unit tests ✅
4. To make things easy for us to take apart, you can set up a simple CI pipeline 🚰
5. If you want to deploy somewhere, make sure you do it in an easily repeatable way, so we don't screw it up 😱
6. You can set up crash reporting, logging or monitoring in case there’s a bug or edge case you didn’t account for 🐛
7. If you’re working with git, keep the history clean and commit messages descriptive 📕

Keep in mind that none of the tips above are required – you can treat them as an opportunity to show us what’s important to you and what your superpowers are.

## By the way

If anything is unclear, feel free to ping me anytime at [milko@toki.bg](mailto:milko@toki.bg).

Also, if you feel like this exercise is too time consuming for your situation, definitely let me know and we’ll figure out something lighter touch 🙂

Good luck!

Milko
