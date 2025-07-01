# TOKI Take Home Full Stack Challenge

Strahil owns a small business, a bakery. With the recent increase of the prices of electricity, he looks for ways to cut costs and increase profits. He wants to be able to explore his electricity consumption and find the best way to cut costs. He has a list of all the metering points he owns, and wants to see data for each one. Along with the consumption, he wants to see the prices of electricity at each point. Since his superpower is in baking, it would be extremely helpful if he could see suggestions for how to cut costs, or at least which points in time he should focus on.

## Your task

Build a webapp that will allow him to see the data for each of his points. Electricity prices and consumption are provided for each hour of the day.
The data is stored in a datalake, backed by an object storage (Google Cloud Storage). To access it you can use the [GCS SDK](https://cloud.google.com/storage/docs/reference/libraries#create-service-account-console) with the following [service account](../toki-take-home-774e713e21c1.json).

### Data format

#### Prices

Prices are stored in [JSON Lines](https://jsonlines.org/) files for each date in the following key format:
`/prices/{year}/{month}/{day}.jsonl`
Each file contains a list of records, each record is a JSON object with the following keys:

- `timestamp`: the timestamp of the record in milliseconds since the epoch
- `price`: the price of electricity
- `currency`: the currency of the price

##### Example

```json
{ "timestamp": 1649732400, "price": 0.12, "currency": "BGN"}
{ "timestamp": 1649736000, "price": 0.13, "currency": "BGN"}
...
```

#### Usage data

Similarly the useage data is stored in [JSON Lines](https://jsonlines.org/) files for each date in the following key format:
`/usage/{year}/{month}/{day}/{metering_point_id}.jsonl`
Each file contains a list of records, each record is a JSON object with the following keys:

- `timestamp`: the timestamp of the record in milliseconds since the epoch
- `kwh`: the amount of electricity used

##### Example

```json
{ "timestamp": 1649732400, "kwh": 0.5}
{ "timestamp": 1649736000, "kwh": 0.6}
```

#### Customer data

Let's assume we already onboarded Strahil's account. We have a list of all the metering points he owns. Each metering point has a unique ID.

JSON representation of a customer

```json
{
  "name": "My Amazing Bakery EOOD",
  "owner": "Strahil",
  "meteringPoints": ["1234", "5678"]
}
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
