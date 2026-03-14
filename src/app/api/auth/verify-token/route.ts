import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { message: "Token is required", valid: false },
        { status: 400 }
      );
    }

    const { data: record, error } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("expires_at, used")
      .eq("token", token)
      .single();

    if (error || !record) {
      return NextResponse.json(
        { message: "Invalid token.", valid: false },
        { status: 400 }
      );
    }

    if (record.used) {
      return NextResponse.json(
        { message: "This token has already been used.", valid: false },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "This token has expired.", valid: false },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Token is valid.", valid: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred", valid: false },
      { status: 500 }
    );
  }
}
