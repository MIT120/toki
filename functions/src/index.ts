import * as functions from "firebase-functions";

export const prices = functions.https.onRequest((_, response) => {
    const res: number[] = []
    for (let i = 0; i < 24; i++) {
        res.push(Math.floor(Math.random() * 600 * 100) / 100 + 50)
    }
    response.send(res);
});
