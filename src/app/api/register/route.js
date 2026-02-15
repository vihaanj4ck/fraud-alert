import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsersCollection, getConnectionErrorMessage } from "@/lib/mongodb";

export async function POST(request) {
  try {
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

    const collection = await getUsersCollection().catch((e) => {
      throw new Error(getConnectionErrorMessage(e));
    });
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
    console.error("[register]", err);
    return NextResponse.json(
      { error: getConnectionErrorMessage(err) },
      { status: 500 }
    );
  }
}
