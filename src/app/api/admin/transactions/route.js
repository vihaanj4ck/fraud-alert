import { NextResponse } from "next/server";
import { getFraudChecksCollection } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlySuspicious = searchParams.get("suspicious") === "true";

    const collection = await getFraudChecksCollection();
    const filter = onlySuspicious ? { status: { $ne: "Safe" } } : {};
    const transactions = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .toArray();

    const list = transactions.map((doc) => ({
      id: doc._id.toString(),
      userId: doc.userId ?? "—",
      amount: doc.totalAmount ?? 0,
      ruleScore: doc.ruleScore ?? 0,
      aiScore: doc.aiRiskScore ?? 0,
      finalScore: doc.finalScore ?? 0,
      status: doc.status ?? "Safe",
      reasoning: doc.reasoning ?? "",
      timestamp: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ transactions: list });
  } catch (err) {
    console.error("[admin/transactions]", err);
    return NextResponse.json(
      { error: err.message || "Failed to load transactions" },
      { status: 500 }
    );
  }
}
