import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase, getUsersCollection, getBlockedAttemptsCollection } from "@/lib/mongodb";
import { checkMalicious } from "@/lib/blocklist";

export async function POST(request) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    if (checkMalicious(email)) {
      try {
        const blockedCol = await getBlockedAttemptsCollection();
        await blockedCol.insertOne({
          type: "registration",
          email,
          timestamp: new Date(),
        });
      } catch (logErr) {
        console.error("[register] blocked_attempts log failed:", logErr?.message);
      }
      return NextResponse.json(
        { error: "Security Alert: This email is flagged in our global fraud database." },
        { status: 403 }
      );
    }

    const collection = await getUsersCollection();
    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      name: name || email.split("@")[0],
      email,
      password: hashedPassword,
      accountStatus: "ACTIVE",
      isBanned: false,
      savedCards: [],
      ipLogs: [],
      loginHistory: [],
      createdAt: new Date(),
      lastLoginIP: null,
      lastDeviceId: null,
      blockedAttempts: 0,
    };

    await collection.insertOne(user);

    return NextResponse.json({ success: true, email });
  } catch (err) {
    const message = err?.message ?? String(err);
    console.error("[register] Database/registration error:", message, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
