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

/**
 * Mock collection used when MongoDB is unavailable. Keeps the app running for demo.
 * insertOne rejects so callers can fall back to file logging; findOne/updateOne no-op.
 */
function createMockCollection() {
  return {
    insertOne() {
      return Promise.reject(new Error("Database unavailable (mock)."));
    },
    findOne() {
      return Promise.resolve(null);
    },
    updateOne() {
      return Promise.resolve({ modifiedCount: 0, matchedCount: 0 });
    },
    insertMany() {
      return Promise.reject(new Error("Database unavailable (mock)."));
    },
    find() {
      return { toArray: () => Promise.resolve([]) };
    },
    deleteOne() {
      return Promise.resolve({ deletedCount: 0 });
    },
    deleteMany() {
      return Promise.resolve({ deletedCount: 0 });
    },
  };
}

function createMockClient() {
  const mockColl = createMockCollection();
  return {
    db() {
      return {
        collection() {
          return mockColl;
        },
      };
    },
  };
}

const rawUri = process.env.MONGODB_URI;
console.log("[mongodb] MONGODB_URI:", maskUriPassword(rawUri));

const uri = rawUri && typeof rawUri === "string" ? rawUri.trim() : "";
const isValidUri =
  uri &&
  (uri.toLowerCase().startsWith("mongodb://") || uri.toLowerCase().startsWith("mongodb+srv://"));

let client;
let clientPromise;

if (!uri || !isValidUri) {
  console.warn("[mongodb] MONGODB_URI missing or invalid. Using mock DB so the app keeps running.");
  clientPromise = Promise.resolve(createMockClient());
} else {
  // Single global promise to prevent multiple connections (especially in dev)
  if (process.env.NODE_ENV === "development" && global._mongoClientPromise) {
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
    if (process.env.NODE_ENV === "development") {
      global._mongoClientPromise = clientPromise;
    }
  }

  clientPromise = clientPromise
    .then((c) => c)
    .catch((err) => {
      console.warn("[mongodb] Connection failed:", err.message, "- using mock DB so the app keeps running.");
      return createMockClient();
    });
}

export default clientPromise;

/** @returns {Promise<import("mongodb").MongoClient>} */
export async function connectToDatabase() {
  return clientPromise;
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
