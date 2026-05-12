import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";
import { isValidRoomNumber } from "@/lib/roomNumber";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, token_number, room_number, admin_secret_code, inviteCode } = body;

    // Admin registration path (unchanged)
    if (role === "admin") {
      if (!name || !email || !password) {
        return NextResponse.json(
          { message: "Missing required fields" },
          { status: 400 }
        );
      }

      if (!admin_secret_code) {
        return NextResponse.json(
          { message: "Admin secret code is required" },
          { status: 400 }
        );
      }

      const { data: settings } = await supabaseAdmin
        .from("settings")
        .select("admin_secret_code")
        .limit(1)
        .single();

      if (!settings || settings.admin_secret_code !== admin_secret_code) {
        return NextResponse.json(
          { message: "Invalid admin secret code" },
          { status: 403 }
        );
      }

      // Check if user already exists
      const { data: existingAdmin } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (existingAdmin) {
        return NextResponse.json(
          { message: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const { error } = await supabaseAdmin.from("users").insert({
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: "admin",
        is_approved: true,
        is_active: true,
        meal_selection_enabled: true,
      });

      if (error) {
        console.error("Admin insert error:", error);
        throw error;
      }

      return NextResponse.json(
        { message: "Admin account created successfully" },
        { status: 201 }
      );
    }

    // Student registration path — requires invite code + room number
    if (!inviteCode || !name || !email || !password || !token_number || room_number === undefined || room_number === null || String(room_number).trim() === "") {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof room_number !== "string" || !isValidRoomNumber(room_number)) {
      return NextResponse.json(
        {
          message:
            "Room number must be 1–20 characters (letters, numbers, spaces, and hyphens only)",
        },
        { status: 400 }
      );
    }

    const normalizedCode = inviteCode.trim().toUpperCase();
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Look up invite code
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from("invite_codes")
      .select("id, is_used, expires_at")
      .eq("code", normalizedCode)
      .single();

    if (codeError || !codeRecord) {
      return NextResponse.json(
        { message: "Invalid invite code" },
        { status: 400 }
      );
    }

    if (codeRecord.is_used) {
      return NextResponse.json(
        { message: "This invite code has already been used" },
        { status: 400 }
      );
    }

    if (new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "This invite code has expired. Please request a new one from administration." },
        { status: 400 }
      );
    }

    // 2. Check email already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insert new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        token_number,
        room_number: String(room_number).trim(),
        role: "student",
        is_approved: false,
        is_active: true,
        meal_selection_enabled: false,
      })
      .select("id")
      .single();

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

    // 5. Mark invite code as used
    await supabaseAdmin
      .from("invite_codes")
      .update({ is_used: true, used_by: newUser.id })
      .eq("id", codeRecord.id);

    return NextResponse.json(
      { message: "Account created successfully", success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
