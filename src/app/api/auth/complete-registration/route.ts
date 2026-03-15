import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, name, password, tokenNumber } = body;

    if (!token || !name || !password || !tokenNumber) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Look up token in email_verification_tokens
    const { data: tokenRecord, error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .select("id, email, invite_code, used, expires_at")
      .eq("token", token)
      .single();

    // 2. Validate: exists, not used, not expired
    if (tokenError || !tokenRecord) {
      return NextResponse.json(
        { message: "Invalid verification token" },
        { status: 400 }
      );
    }

    if (tokenRecord.used) {
      return NextResponse.json(
        { message: "This verification token has already been used" },
        { status: 400 }
      );
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "This verification token has expired" },
        { status: 400 }
      );
    }

    // 3. Get email and invite_code from token record
    const email = tokenRecord.email;
    const inviteCode = tokenRecord.invite_code;

    // 4. Re-validate invite code: exists, not used, not expired
    if (!inviteCode) {
         return NextResponse.json(
            { message: "Invalid verification data: Missing invite code" },
            { status: 400 }
          );
    }

    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from("invite_codes")
      .select("id, is_used, expires_at")
      .eq("code", inviteCode)
      .single();

    if (codeError || !codeRecord) {
      return NextResponse.json(
        { message: "Invalid associated invite code" },
        { status: 400 }
      );
    }

    if (codeRecord.is_used) {
      return NextResponse.json(
        { message: "The associated invite code has already been used" },
        { status: 400 }
      );
    }

    if (new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { message: "The associated invite code has expired" },
        { status: 400 }
      );
    }

    // 5. Check email not already in users table
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

    // 6. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Insert new user
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email: email,
        password: hashedPassword,
        token_number: tokenNumber, // token_number based on original logic and user request
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
      return NextResponse.json(
          { message: "Failed to create user" },
          { status: 500 }
      );
    }

    // 8. Mark token as used=true
    await supabaseAdmin
      .from("email_verification_tokens")
      .update({ used: true })
      .eq("id", tokenRecord.id);

    // 9. Mark invite code: is_used=true, used_by=new user id
    await supabaseAdmin
      .from("invite_codes")
      .update({ is_used: true, used_by: newUser.id })
      .eq("id", codeRecord.id);

    // 10. Return 200 { success: true }
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("complete-registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration finalization" },
      { status: 500 }
    );
  }
}
