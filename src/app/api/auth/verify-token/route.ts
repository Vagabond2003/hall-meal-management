import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { valid: false, message: "Token is required" },
        { status: 400 }
      );
    }

    // Look up token
    const { data: tokenRecord, error } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("email, expires_at, used")
      .eq("token", token)
      .single();

    if (error || !tokenRecord) {
      return NextResponse.json(
        { valid: false, message: "Invalid or unknown verification token" },
        { status: 400 }
      );
    }

    // Check if already used
    if (tokenRecord.used) {
      return NextResponse.json(
        { valid: false, message: "This verification link has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, message: "This verification link has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true, email: tokenRecord.email },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json(
      { valid: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
