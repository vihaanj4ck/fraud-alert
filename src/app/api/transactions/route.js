import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getTransactionsCollection } from "@/lib/mongodb";

/**
 * PATCH: Update an existing transaction (allowed → success or failed).
 * Body: { transactionId, outcome: 'success'|'failed', paymentMethod?, mobile?, failureReason? }
 */
export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { transactionId, outcome, paymentMethod, mobile, failureReason } = body;
    if (!transactionId || !outcome) {
      return NextResponse.json(
        { error: "transactionId and outcome required" },
        { status: 400 }
      );
    }
    if (outcome !== "success" && outcome !== "failed") {
      return NextResponse.json(
        { error: "outcome must be success or failed" },
        { status: 400 }
      );
    }
    let id;
    try {
      id = new ObjectId(transactionId);
    } catch {
      return NextResponse.json({ error: "Invalid transactionId" }, { status: 400 });
    }
    const coll = await getTransactionsCollection();
    const update = {
      outcome,
      updatedAt: new Date(),
      ...(outcome === "success" && {
        paymentMethod: paymentMethod || null,
        mobile: mobile || null,
      }),
      ...(outcome === "failed" && { failureReason: failureReason || "Unknown" }),
    };
    const result = await coll.updateOne(
      { _id: id },
      { $set: update }
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, outcome });
  } catch (e) {
    console.error("[transactions] PATCH error:", e.message);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
