import { NextResponse } from "next/server";
import { setOtp, pruneOtpStore } from "@/lib/otp-store";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const transactionId = body.transactionId || null;
    pruneOtpStore();
    const code = String(Math.floor(1000 + Math.random() * 9000)).padStart(4, "0");
    const sessionId = `otp_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    setOtp(sessionId, code, transactionId);
    return NextResponse.json({
      sessionId,
      demoOtp: code,
      message: "OTP: " + code,
      expiresIn: 300,
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 });
  }
}
