import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { getClientIpFromRequest } from "@/lib/auth";
import { getIpLogsCollection, getUsersCollection } from "@/lib/mongodb";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_DISTINCT_IP_DEVICE = 3;

/**
 * Parse User-Agent for browser name, OS, and device model.
 */
function parseUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return { browser: "Unknown", os: "Unknown", deviceModel: "Unknown" };
  }
  try {
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser().name || "Unknown";
    const os = parser.getOS().name || "Unknown";
    const device = parser.getDevice();
    const deviceModel = device.model || device.type || "Desktop";
    return { browser, os, deviceModel };
  } catch {
    return { browser: "Unknown", os: "Unknown", deviceModel: "Unknown" };
  }
}

/**
 * POST /api/ip/log
 * Body: { userId?: string, accountId?: string } - userId for logged-in, accountId for guest
 * Headers: User-Agent (parsed for browser, OS, device)
 * If >3 distinct IP+Device combos in last 10 min for this user, set accountStatus=BANNED.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = (body.userId || body.accountId || "guest").toString().trim() || "guest";
    const clientIp = getClientIpFromRequest(request) || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "";
    const { browser, os, deviceModel } = parseUserAgent(userAgent);

    const deviceCombo = `${browser}|${os}|${deviceModel}`;

    const coll = await getIpLogsCollection();
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);

    // Check if user is already banned in users collection
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

    // Log this attempt with full device fingerprint
    await coll.insertOne({
      userId,
      ip: clientIp,
      browser,
      os,
      deviceModel,
      deviceCombo,
      type: "log",
      createdAt: now,
    });

    // Count distinct IP+Device combinations for this user in last 10 minutes
    const distinctCombos = await coll
      .aggregate([
        { $match: { userId, type: "log", createdAt: { $gte: windowStart } } },
        { $group: { _id: { ip: "$ip", deviceCombo: "$deviceCombo" } } },
        { $count: "total" },
      ])
      .toArray();
    const distinctCount = distinctCombos[0]?.total ?? 0;

    if (distinctCount > MAX_DISTINCT_IP_DEVICE && userId !== "guest") {
      const usersColl = await getUsersCollection();
      await usersColl.updateOne(
        { email: userId },
        { $set: { accountStatus: "BANNED", bannedAt: now } }
      );
      await coll.insertOne({
        userId,
        type: "ban",
        reason: `More than ${MAX_DISTINCT_IP_DEVICE} distinct IP+Device combinations within 10 minutes`,
        createdAt: now,
      });
      return NextResponse.json({
        ok: false,
        banned: true,
        highRisk: true,
        error: "ACCOUNT BANNED: Too many IP/device combinations detected.",
      });
    }

    if (distinctCount > MAX_DISTINCT_IP_DEVICE) {
      return NextResponse.json({
        ok: false,
        banned: true,
        highRisk: true,
        error: "Suspicious activity: Too many IP/device combinations.",
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
