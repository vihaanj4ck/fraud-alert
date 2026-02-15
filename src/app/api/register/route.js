import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUsersCollection } from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
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
      email,
      password: hashedPassword,
      createdAt: new Date(),
      lastLoginIP: null,
      lastDeviceId: null,
      loginHistory: [],
      blockedAttempts: 0,
    };

    await collection.insertOne(user);

    return NextResponse.json({ success: true, email });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json(
      { error: err.message || "Registration failed." },
      { status: 500 }
    );
  }
}
