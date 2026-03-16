import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("id, email, used, expires_at, signup_mode")
      .eq("token", token)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        { message: "Invalid verification link" },
        { status: 400 }
      );
    }

    if (tokenRecord.used) {
      return NextResponse.json(
        { message: "This verification link has already been used" },
        { status: 400 }
      );
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "This verification link has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true, email: tokenRecord.email, signupMode: tokenRecord.signup_mode || "student" },
      { status: 200 }
    );
  } catch (error) {
    console.error("verify-token error:", error);
    return NextResponse.json(
      { message: "An error occurred while verifying the token" },
      { status: 500 }
    );
  }
}
