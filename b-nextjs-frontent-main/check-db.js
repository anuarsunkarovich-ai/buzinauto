
import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient('mongodb://localhost:27017');
  try {
    await client.connect();
    const db = client.db('buzinavto');
    const users = await db.collection('user-profile').find().toArray();
    console.log('Users in DB:', users.length);
    console.log(JSON.stringify(users, null, 2));
  } finally {
    await client.close();
  }
}

run().catch(console.error);
