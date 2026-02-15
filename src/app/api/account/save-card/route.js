import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getUsersCollection } from "@/lib/mongodb";

export async function POST(request) {
  try {
    const auth = getAuthUser(request);
    if (!auth?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const last4 = typeof body.last4 === "string" ? body.last4.replace(/\D/g, "").slice(-4) : "";
    const brand = typeof body.brand === "string" ? body.brand.trim().slice(0, 20) : "Card";

    if (last4.length !== 4) {
      return NextResponse.json({ error: "Invalid card" }, { status: 400 });
    }

    const collection = await getUsersCollection();
    const masked = `•••• •••• •••• ${last4}`;
    const existing = await collection.findOne({
      email: auth.sub,
      "savedCards.last4": last4,
      "savedCards.brand": brand,
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Card already saved" });
    }

    await collection.updateOne(
      { email: auth.sub },
      {
        $push: {
          savedCards: {
            $each: [{ last4, brand, masked, addedAt: new Date() }],
            $slice: -10,
          },
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[save-card]", err);
    return NextResponse.json({ error: "Failed to save card" }, { status: 500 });
  }
}
