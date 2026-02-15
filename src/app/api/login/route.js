import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UAParser } from "ua-parser-js";
import { getUsersCollection } from "@/lib/mongodb";
import { getClientIpFromRequest, createToken } from "@/lib/auth";

function parseUserAgent(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    return { deviceModel: "Unknown", os: "Unknown" };
  }
  try {
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const os = parser.getOS().name || "Unknown";
    const deviceModel = device?.model || device?.type || "Desktop";
    return { deviceModel, os };
  } catch {
    return { deviceModel: "Unknown", os: "Unknown" };
  }
}

const RAPID_LOGIN_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Login fraud detection: compute risk and triggered signals.
 * Does not modify user; caller updates user after.
 */
function computeLoginRisk(user, currentIP, currentDeviceId) {
  let risk = 0;
  const triggeredSignals = [];

  const lastIP = user?.lastLoginIP && String(user.lastLoginIP).trim();
  const lastDeviceId = user?.lastDeviceId && String(user.lastDeviceId).trim();
  const history = Array.isArray(user?.loginHistory) ? user.loginHistory : [];

  if (lastIP && currentIP && lastIP !== currentIP) {
    risk += 30;
    triggeredSignals.push("IP address changed (+30)");
  }

  if (lastDeviceId && currentDeviceId && lastDeviceId !== currentDeviceId) {
    risk += 25;
    triggeredSignals.push("New device detected (+25)");
  }

  const now = Date.now();
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;
  const lastTimestamp = lastEntry?.timestamp ? new Date(lastEntry.timestamp).getTime() : 0;
  const lastEntryIP = lastEntry?.ip && String(lastEntry.ip).trim();
  const withinFiveMin = lastTimestamp > 0 && now - lastTimestamp < RAPID_LOGIN_WINDOW_MS;
  if (withinFiveMin && currentIP && lastEntryIP && currentIP !== lastEntryIP) {
    risk += 40;
    triggeredSignals.push("Rapid login from different IP (+40)");
  }

  if (risk > 100) risk = 100;

  return { risk, triggeredSignals };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const currentIP = getClientIpFromRequest(request);
    const userAgent = request.headers.get("user-agent") || "";
    const { deviceModel, os } = parseUserAgent(userAgent);

    const collection = await getUsersCollection();
    const user = await collection.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.accountStatus === "BANNED") {
      return NextResponse.json(
        { error: "Your account has been banned due to suspicious activity." },
        { status: 403 }
      );
    }

    const passwordOk = await bcrypt.compare(password, user.password || "");
    if (!passwordOk) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const { risk, triggeredSignals } = computeLoginRisk(user, currentIP, deviceId);

    const ipLogEntry = {
      ip: currentIP || "",
      deviceModel: deviceModel || "Unknown",
      os: os || "Unknown",
      timestamp: new Date(),
    };

    const updateOp = {
      $set: {
        lastLoginIP: currentIP || null,
        lastDeviceId: deviceId || null,
      },
      $push: {
        loginHistory: {
          ip: currentIP || "",
          deviceId: deviceId || "",
          timestamp: new Date(),
        },
        ipLogs: { $each: [ipLogEntry], $slice: -100 },
      },
    };
    if (risk > 60) {
      updateOp.$inc = { blockedAttempts: 1 };
    }

    await collection.updateOne({ email }, updateOp);

    const token = createToken(user.email);

    return NextResponse.json({
      token,
      user: { email: user.email, name: user.name || user.email?.split("@")[0] || "User" },
      loginRiskScore: risk,
      triggeredSignals: triggeredSignals || [],
    });
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json(
      { error: err.message || "Login failed." },
      { status: 500 }
    );
  }
}
