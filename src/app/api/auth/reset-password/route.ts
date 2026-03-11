import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const { token, newPassword } = await request.json();

  if (!token || !newPassword) {
    return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    // Look up the token
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used")
      .eq("token", token)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
    }

    if (resetToken.used) {
      return NextResponse.json({ error: "This reset link has already been used. Please request a new one." }, { status: 400 });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ password: hashedPassword })
      .eq("id", resetToken.user_id);

    if (updateError) throw updateError;

    // Mark the token as used
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", resetToken.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
