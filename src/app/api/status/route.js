import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  let dbConnected = false;
  try {
    await connectToDatabase();
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  return NextResponse.json({
    ai: !!process.env.HF_TOKEN,
    db: dbConnected,
  });
}
