import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, password, token_number } = body;

    if (!token || !name || !password || !token_number) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Look up and validate token
    const { data: record, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .single();

    if (tokenError || !record) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 400 }
      );
    }

    if (record.used) {
      return NextResponse.json(
        { message: "This token has already been used" },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "This token has expired" },
        { status: 400 }
      );
    }

    const { email } = record;

    // 2. Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert user
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: "student",
      token_number,
      is_approved: false, // Students require admin approval
      is_active: true,
      meal_selection_enabled: false,
    };

    const { error: insertError } = await supabaseAdmin
      .from("users")
      .insert(userData);

    if (insertError) {
      console.error("User insert error:", insertError);
      if (insertError.code === "23505" && insertError.message.includes("token_number")) {
        return NextResponse.json(
          { message: "This Token number is already registered" },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // 5. Mark token as used
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used: true })
      .eq("id", record.id);

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Complete registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
