import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createRateLimiter } from "@/lib/rate-limit";
import nodemailer from "nodemailer";

const sendVerificationLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 per hour per email

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { inviteCode, email, signupMode, adminSecretCode } = body;

    // 1. Both fields required
    if (!inviteCode || !email) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // 2. Trim and uppercase inviteCode
    const normalizedCode = inviteCode.trim().toUpperCase();
    const normalizedEmail = email.toLowerCase().trim();
    const mode = signupMode === "admin" ? "admin" : "student";

    // Rate limit by email
    const rateLimit = sendVerificationLimiter(normalizedEmail);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // 3. If admin signup, validate admin secret code
    if (mode === "admin") {
      if (!adminSecretCode) {
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

      if (!settings || settings.admin_secret_code !== adminSecretCode) {
        return NextResponse.json(
          { message: "Invalid admin secret code" },
          { status: 403 }
        );
      }
    }

    // 4. Look up invite code
    const { data: codeRecord, error: codeError } = await supabaseAdmin
      .from("invite_codes")
      .select("id, code, is_used, expires_at")
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
        { message: "This invite code has expired" },
        { status: 400 }
      );
    }

    // 5. Check email in users table
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

    // 6. Generate token
    const token = crypto.randomUUID();

    // 7. Delete any existing unused tokens for this email first
    await supabaseAdmin
      .from("email_verification_tokens")
      .delete()
      .eq("email", normalizedEmail)
      .eq("used", false);

    // 8. Insert into email_verification_tokens (with signup_mode)
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { error: tokenError } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        email: normalizedEmail,
        token: token,
        expires_at: oneHourFromNow,
        invite_code: normalizedCode,
        signup_mode: mode,
      });

    if (tokenError) {
      console.error("Error creating token:", tokenError);
      return NextResponse.json(
        { message: "Failed to generate verification token" },
        { status: 500 }
      );
    }

    // 9. Send email via Brevo SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp-relay.brevo.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_PASS,
        },
      });

      const verificationLink = `https://hall-meal-management.vercel.app/complete-registration?token=${token}`;

      await transporter.sendMail({
        from: '"Hall Meal Management" <hallmealmanager@gmail.com>',
        to: normalizedEmail,
        subject: mode === "admin"
          ? "Verify your email to create your admin account"
          : "Verify your email to create your account",
        html: `
          <div style="font-family: Arial, sans-serif; color: #1A3A2A; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
            <h2 style="color: #1A3A2A; text-align: center;">Verify Your Email</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              Click below to verify your email and complete your ${mode === "admin" ? "admin " : ""}registration. Link expires in 1 hour.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #1A3A2A; color: #C4873A; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
                Verify Email
              </a>
            </div>
            <p style="font-size: 12px; color: #777; text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              If you didn't request this, ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      // 10. If sendMail throws: delete the token from DB, log error, return 500
      console.error("Failed to send email:", emailError);
      await supabaseAdmin
        .from("email_verification_tokens")
        .delete()
        .eq("token", token);
      
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 }
      );
    }

    // 11. Return 200
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("send-verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
