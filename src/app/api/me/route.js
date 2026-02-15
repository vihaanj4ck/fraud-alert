import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const auth = getAuthUser(request);
    if (!auth?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getUsersCollection();
    const user = await collection.findOne(
      { email: auth.sub },
      { projection: { password: 0 } }
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.accountStatus === "BANNED") {
      return NextResponse.json(
        { error: "Account banned", banned: true },
        { status: 403 }
      );
    }

    const savedCards = Array.isArray(user.savedCards) ? user.savedCards : [];
    const ipLogs = Array.isArray(user.ipLogs) ? user.ipLogs.slice(-20).reverse() : [];

    return NextResponse.json({
      user: {
        email: user.email,
        name: user.name || user.email?.split("@")[0] || "User",
        savedCards,
        ipLogs,
      },
    });
  } catch (err) {
    console.error("[me]", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
