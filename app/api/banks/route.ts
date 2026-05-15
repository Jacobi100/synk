import { NextResponse } from "next/server";
import { squadGetBankList } from "@/lib/squad";

export async function GET() {
  try {
    const banks = await squadGetBankList();
    return NextResponse.json({ banks });
  } catch (e) {
    console.error("/api/banks error:", e);
    return NextResponse.json({ banks: [] });
  }
}
