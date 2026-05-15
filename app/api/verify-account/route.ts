import { NextResponse } from "next/server";
import { squadResolveAccountName } from "@/lib/squad";

export async function POST(req: Request) {
  try {
    const { bank_code, account_number } = await req.json();
    if (!bank_code || !account_number) {
      return NextResponse.json(
        { error: "bank_code and account_number are required" },
        { status: 400 },
      );
    }
    if (account_number.length !== 10) {
      return NextResponse.json(
        { error: "account_number must be exactly 10 digits" },
        { status: 400 },
      );
    }
    const result = await squadResolveAccountName(bank_code, account_number);
    if (!result) {
      return NextResponse.json(
        { error: "Could not resolve account name. Check the bank and account number." },
        { status: 404 },
      );
    }
    return NextResponse.json({ account_name: result.account_name });
  } catch (e) {
    console.error("/api/verify-account error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
