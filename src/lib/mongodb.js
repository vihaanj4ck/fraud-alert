// DNS hardening: use Google DNS so MongoDB hostname resolves (setServers is on node:dns, not dns/promises)
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { MongoClient } from 'mongodb';

const options = {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

let client;
let clientPromise;

// Only initialize MongoClient when MONGODB_URI exists (prevents build crash when var is injected at runtime)
const uri = process.env.MONGODB_URI;
if (!uri || typeof uri !== 'string' || uri.trim() === '') {
  clientPromise = Promise.reject(new Error('Please add your Mongo URI to .env.local'));
} else {
  try {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri, options);
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      client = new MongoClient(uri, options);
      clientPromise = client.connect();
    }
  } catch (err) {
    clientPromise = Promise.reject(err);
  }
}

export default clientPromise;

/** @returns {Promise<import("mongodb").MongoClient>} */
export async function connectToDatabase() {
  return clientPromise;
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getFraudChecksCollection() {
  const client = await clientPromise;
  return client.db().collection('fraud_checks');
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getFraudContextCollection() {
  const client = await clientPromise;
  return client.db().collection('fraud_context');
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getUsersCollection() {
  const client = await clientPromise;
  return client.db().collection('users');
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getTransactionsCollection() {
  const client = await clientPromise;
  return client.db().collection('transactions');
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getIpLogsCollection() {
  const client = await clientPromise;
  return client.db().collection('ip_logs');
}
