// DNS hardening: use Google DNS so MongoDB hostname resolves
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { MongoClient } from "mongodb";

const CONNECT_TIMEOUT_MS = 5000;

const options = {
  connectTimeoutMS: CONNECT_TIMEOUT_MS,
  socketTimeoutMS: 45000,
};

function maskUriPassword(uriString) {
  if (!uriString || typeof uriString !== "string") return "(missing)";
  try {
    return uriString.replace(/:([^:@]+)@/, ":****@");
  } catch {
    return "(unable to mask)";
  }
}

const rawUri = process.env.MONGODB_URI;
console.log("[mongodb] MONGODB_URI:", maskUriPassword(rawUri));

if (!rawUri) {
  throw new Error("MONGODB_URI is missing from environment variables");
}

const uri = rawUri.trim();
const isValidUri =
  uri.toLowerCase().startsWith("mongodb://") || uri.toLowerCase().startsWith("mongodb+srv://");

if (!isValidUri) {
  throw new Error(
    "MONGODB_URI must start with mongodb:// or mongodb+srv://. Got: " + uri.substring(0, 20) + "..."
  );
}

let client;
let clientPromise;
let _resolved = false;

const connectPromise = (() => {
  if (process.env.NODE_ENV === "development" && global._mongoClientPromise) {
    return global._mongoClientPromise;
  }
  client = new MongoClient(uri, options);
  const p = client.connect();
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise = p;
  }
  return p;
})();

clientPromise = Promise.race([
  connectPromise,
  new Promise((_, reject) =>
    setTimeout(
      () => reject(new Error("Database Connection Failed. Check DNS/IP Whitelist.")),
      CONNECT_TIMEOUT_MS
    )
  ),
]).then((c) => {
  _resolved = true;
  return c;
});

export default clientPromise;

/** @returns {Promise<import("mongodb").MongoClient>} */
export async function connectToDatabase() {
  return clientPromise;
}

function isConnectionError(err) {
  const msg = (err && err.message) || "";
  return (
    msg.includes("Connection Failed") ||
    msg.includes("Check DNS/IP") ||
    msg.includes("connection") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ENOTFOUND")
  );
}

export function getConnectionErrorMessage(err) {
  if (isConnectionError(err)) {
    return "Database Connection Failed. Check DNS/IP Whitelist.";
  }
  return "Registration failed.";
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getFraudChecksCollection() {
  const c = await clientPromise;
  return c.db().collection("fraud_checks");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getFraudContextCollection() {
  const c = await clientPromise;
  return c.db().collection("fraud_context");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getUsersCollection() {
  const c = await clientPromise;
  return c.db().collection("users");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getTransactionsCollection() {
  const c = await clientPromise;
  return c.db().collection("transactions");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getIpLogsCollection() {
  const c = await clientPromise;
  return c.db().collection("ip_logs");
}
