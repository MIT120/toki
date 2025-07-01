// Import the functions you need from the SDKs you need
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const serviceAccount = require('../toki-take-home-774e713e21c1.json');

// Initialize Firebase
const app = initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore(app);

db.collection('customers').get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
      });
})
