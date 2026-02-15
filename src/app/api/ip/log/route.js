import { NextResponse } from "next/server";
import { getClientIpFromRequest } from "@/lib/auth";
import { getIpLogsCollection } from "@/lib/mongodb";

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_DISTINCT_IPS = 2;

/**
 * POST /api/ip/log
 * Body: { accountId: string } (e.g. email, or "guest")
 * Logs client IP for this account. If > MAX_DISTINCT_IPS distinct IPs in last 5 min, flags HIGH RISK and bans account.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const accountId = (body.accountId || "guest").toString().trim() || "guest";
    const clientIp = getClientIpFromRequest(request) || request.headers.get("x-real-ip") || "unknown";

    const coll = await getIpLogsCollection();
    const now = new Date();
    const windowStart = new Date(now.getTime() - WINDOW_MS);

    // Check if already banned
    const existingBan = await coll.findOne({ accountId, type: "ban" });
    if (existingBan) {
      return NextResponse.json({
        ok: false,
        banned: true,
        highRisk: true,
        error: "ACCOUNT BANNED: Too many IP addresses detected.",
      });
    }

    // Log this IP attempt
    await coll.insertOne({
      accountId,
      ip: clientIp,
      type: "log",
      createdAt: now,
    });

    // Count distinct IPs for this account in the last 5 minutes
    const distinctIps = await coll
      .aggregate([
        { $match: { accountId, type: "log", createdAt: { $gte: windowStart } } },
        { $group: { _id: "$ip" } },
        { $count: "total" },
      ])
      .toArray();
    const distinctCount = distinctIps[0]?.total ?? 0;

    if (distinctCount > MAX_DISTINCT_IPS) {
      await coll.insertOne({
        accountId,
        type: "ban",
        createdAt: now,
        reason: "More than 2 distinct IPs within 5 minutes",
      });
      return NextResponse.json({
        ok: false,
        banned: true,
        highRisk: true,
        error: "ACCOUNT BANNED: Too many IP addresses detected.",
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
