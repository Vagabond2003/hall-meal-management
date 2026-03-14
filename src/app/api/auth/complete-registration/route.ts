import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, password, token_number } = body;

    if (!token || !name || !password || !token_number) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Look up and re-validate the token
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("email, expires_at, used")
      .eq("token", token)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        { message: "Invalid verification token" },
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

    const email = tokenRecord.email;

    // Check again that email doesn't already exist in users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email,
        password: hashedPassword,
        token_number,
        role: "student",
        is_approved: false,
        is_active: true,
        meal_selection_enabled: false,
      });

    if (insertError) {
      console.error("User insert error:", insertError);
      if (insertError.code === "23505" && insertError.message.includes("token_number")) {
        return NextResponse.json(
          { message: "This Token number is already registered" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { message: "Failed to create account" },
        { status: 500 }
      );
    }

    // Mark token as used
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used: true })
      .eq("token", token);

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Complete registration error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
