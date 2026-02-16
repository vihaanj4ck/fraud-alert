import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { getClientIpFromRequest } from "@/lib/auth";
import { getIpLogsCollection, getUsersCollection } from "@/lib/mongodb";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_DISTINCT_DEVICES = 3;

/**
 * Parse User-Agent for browser name and OS (for server-side fallback when deviceHash not sent).
 */
function parseUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return { browser: "Unknown", os: "Unknown" };
  }
  try {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || "Unknown";
    const os = parser.getOS().name || "Unknown";
    return { browser, os };
  } catch {
    return { browser: "Unknown", os: "Unknown" };
  }
}

/**
 * Build DeviceHash from IP + browser + OS.
 */
function buildDeviceHash(ip, browser, os) {
  const safe = (s) => (s != null && typeof s === "string" ? s.trim() : "") || "unknown";
  return `${safe(ip)}|${safe(browser)}|${safe(os)}`;
}

/**
 * POST /api/ip/log
 * Body: { userId?: string, accountId?: string, deviceHash?: string }
 * - If client sends deviceHash (IP|Browser|OS), use it for velocity check.
 * - Otherwise build deviceHash from request IP + User-Agent.
 * Logs UserID, DeviceHash, Timestamp to ip_logs.
 * If count(distinct DeviceHash) for this UserID in last 10 min > 3, set user accountStatus = BANNED.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = (body.userId || body.accountId || "guest").toString().trim() || "guest";
    const clientIp = getClientIpFromRequest(request) || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const { browser, os } = parseUserAgent(userAgent);

    let deviceHash = typeof body.deviceHash === "string" ? body.deviceHash.trim() : "";
    if (!deviceHash) {
      deviceHash = buildDeviceHash(clientIp, browser, os);
    }

    const coll = await getIpLogsCollection();
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);

    if (userId !== "guest") {
      const usersColl = await getUsersCollection();
      const user = await usersColl.findOne({ email: userId });
      if (user?.accountStatus === "BANNED") {
        return NextResponse.json({
          ok: false,
          banned: true,
          highRisk: true,
          error: "ACCOUNT BANNED: Suspicious activity detected.",
        });
      }
    }

    await coll.insertOne({
      userId,
      deviceHash,
      ip: clientIp,
      browser,
      os,
      type: "log",
      createdAt: now,
    });

    const distinctDevices = await coll
      .aggregate([
        { $match: { userId, type: "log", createdAt: { $gte: windowStart } } },
        { $group: { _id: "$deviceHash" } },
        { $count: "total" },
      ])
      .toArray();
    const distinctCount = distinctDevices[0]?.total ?? 0;

    if (distinctCount > MAX_DISTINCT_DEVICES && userId !== "guest") {
      const usersColl = await getUsersCollection();
      await usersColl.updateOne(
        { email: userId },
        { $set: { accountStatus: "BANNED", bannedAt: now } }
      );
      await coll.insertOne({
        userId,
        type: "ban",
        reason: "More than 3 unique devices (DeviceHash) within 10 minutes",
        createdAt: now,
      });
      return NextResponse.json({
        ok: false,
        banned: true,
        highRisk: true,
        error: "ACCOUNT BANNED: 3+ unique devices detected in under 10 minutes.",
      });
    }

    if (distinctCount > MAX_DISTINCT_DEVICES) {
      return NextResponse.json({
        ok: false,
        banned: true,
        highRisk: true,
        error: "Suspicious activity: Too many unique devices.",
      });
    }

    return NextResponse.json({ ok: true, banned: false, highRisk: false });
  } catch (err) {
    console.error("[ip/log]", err.message);
    return NextResponse.json(
      { ok: false, banned: false, error: "IP log failed" },
      { status: 500 }
    );
  }
}
