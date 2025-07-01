from google.cloud import firestore

db = firestore.Client.from_service_account_json('../toki-take-home-774e713e21c1.json')

# Then query for documents
users_ref = db.collection(u'customers')

for doc in users_ref.stream():
    print(u'{} => {}'.format(doc.id, doc.to_dict()))
