import { NextResponse } from "next/server";
import { getOtp, deleteOtp, incrementFailedAttempts } from "@/lib/otp-store";

function normalizeOtp(value) {
  return String(value).replace(/\D/g, "").trim().padStart(4, "0").slice(-4);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sessionId, otp } = body;
    if (!sessionId || otp === undefined) {
      return NextResponse.json({ valid: false, error: "sessionId and otp required" }, { status: 400 });
    }
    const data = getOtp(sessionId);
    if (!data) {
      return NextResponse.json({
        valid: false,
        error: "OTP session expired or invalid. Please go back and click Pay again to get a new code.",
      });
    }
    const entered = normalizeOtp(otp);
    const expected = data.code;
    const valid = entered.length === 4 && entered === expected;
    if (valid) {
      deleteOtp(sessionId);
      return NextResponse.json({ valid: true, error: null });
    }
    const { attempts, locked } = incrementFailedAttempts(sessionId);
    if (locked) {
      return NextResponse.json({
        valid: false,
        locked: true,
        error: "Too many wrong attempts. Transaction failed.",
      });
    }
    return NextResponse.json({
      valid: false,
      error: `Incorrect OTP. ${3 - attempts} attempt(s) remaining.`,
    });
  } catch (e) {
    return NextResponse.json({ valid: false, error: "Verification failed" }, { status: 500 });
  }
}
