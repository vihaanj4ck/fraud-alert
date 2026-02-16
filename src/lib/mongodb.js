// DNS hardening: use Google DNS so MongoDB hostname resolves
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import { MongoClient } from "mongodb";

const CONNECT_TIMEOUT_MS = 30000; // 30 seconds to bypass local network lag
const SOCKET_TIMEOUT_MS = 30000;

const options = {
  connectTimeoutMS: CONNECT_TIMEOUT_MS,
  socketTimeoutMS: SOCKET_TIMEOUT_MS,
};

function maskUriPassword(uriString) {
  if (!uriString || typeof uriString !== "string") return "(missing)";
  try {
    return uriString.replace(/:([^:@]+)@/, ":****@");
  } catch {
    return "(unable to mask)";
  }
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

const rawUri = process.env.MONGODB_URI;
const uri = rawUri && typeof rawUri === "string" ? rawUri.trim() : "";
const isValidUri =
  uri &&
  (uri.toLowerCase().startsWith("mongodb+srv://") || uri.toLowerCase().startsWith("mongodb://"));

// Defer production validation to connectToDatabase() so the module can load at build time (e.g. Vercel).
console.log("[mongodb] MONGODB_URI:", maskUriPassword(uri));

let client = null;
let clientPromise = null;

if (uri && isValidUri) {
  client = new MongoClient(uri, options);
  if (process.env.NODE_ENV === "development" && global._mongoClientPromise) {
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise = client.connect();
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = clientPromise;
    }
  }
}

export default clientPromise;

/**
 * Waits for the MongoDB connection to be ready before allowing API calls to proceed.
 * Resolves only after the connection is established and a ping succeeds.
 * @returns {Promise<import("mongodb").MongoClient>}
 */
export async function connectToDatabase() {
  if (process.env.NODE_ENV === "production" && (!uri || !isValidUri)) {
    throw new Error(
      "[mongodb] MONGODB_URI must be set and must use mongodb+srv:// or mongodb:// scheme. " +
        "Current value: " + maskUriPassword(rawUri || "")
    );
  }
  if (!clientPromise) {
    throw new Error("[mongodb] MONGODB_URI is not set or invalid. Set MONGODB_URI in your environment.");
  }
  const c = await clientPromise;
  await c.db("admin").command({ ping: 1 });
  return c;
}

export function getConnectionErrorMessage(err) {
  if (isConnectionError(err)) {
    return "Database Connection Failed. Check DNS/IP Whitelist.";
  }
  return "Registration failed.";
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getFraudChecksCollection() {
  const c = await connectToDatabase();
  return c.db().collection("fraud_checks");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getFraudContextCollection() {
  const c = await connectToDatabase();
  return c.db().collection("fraud_context");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getUsersCollection() {
  const c = await connectToDatabase();
  return c.db().collection("users");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getTransactionsCollection() {
  const c = await connectToDatabase();
  return c.db().collection("transactions");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getIpLogsCollection() {
  const c = await connectToDatabase();
  return c.db().collection("ip_logs");
}

/** @returns {Promise<import("mongodb").Collection>} */
export async function getBlockedAttemptsCollection() {
  const c = await connectToDatabase();
  return c.db().collection("blocked_attempts");
}
