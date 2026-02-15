import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";

const VELOCITY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_UNIQUE_IPS = 3;

/**
 * POST /api/checkout
 * Called when user proceeds to checkout. Runs IP velocity check:
 * - If user is already banned → 403
 * - If loginHistory in last 10 minutes has > 3 unique IPs → set isBanned, 403
 * - Otherwise → 200
 */
export async function POST(request) {
  try {
    const auth = getAuthUser(request);
    const userId = auth?.sub;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getUsersCollection();
    const user = await collection.findOne({ email: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned === true || user.accountStatus === "BANNED") {
      return NextResponse.json(
        { error: "Account Banned: Multiple IP Anomalies Detected", banned: true },
        { status: 403 }
      );
    }

    const loginHistory = Array.isArray(user.loginHistory) ? user.loginHistory : [];
    const now = Date.now();
    const cutoff = now - VELOCITY_WINDOW_MS;
    const recent = loginHistory.filter((entry) => {
      const ts = entry?.timestamp ? new Date(entry.timestamp).getTime() : 0;
      return ts >= cutoff;
    });
    const uniqueIps = new Set(recent.map((e) => String(e?.ip || "").trim()).filter(Boolean));
    const count = uniqueIps.size;

    if (count > MAX_UNIQUE_IPS) {
      await collection.updateOne(
        { email: userId },
        { $set: { isBanned: true, accountStatus: "BANNED", bannedAt: new Date() } }
      );
      return NextResponse.json(
        { error: "Account Banned: Multiple IP Anomalies Detected", banned: true },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: err.message || "Checkout check failed" },
      { status: 500 }
    );
  }
}
