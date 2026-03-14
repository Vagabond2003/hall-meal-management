import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // 1. Check if user already exists
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

    // 2. Generate secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // 3. Save to database
    const { error: dbError } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error("Failed to save verification token:", dbError);
      return NextResponse.json(
        { message: "Failed to create verification token" },
        { status: 500 }
      );
    }

    // 4. Send Email via Resend
    const confirmLink = `${process.env.NEXTAUTH_URL || "https://hall-meal-management.vercel.app"}/complete-registration?token=${token}`;

    const { error: emailError } = await resend.emails.send({
      from: "Hall Meal Management <onboarding@resend.dev>",
      to: email,
      subject: "Verify your email to create your account",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E4E2DA; border-radius: 8px;">
          <h2 style="color: #1A3A2A; text-align: center; font-family: 'Playfair Display', serif;">HALL MEAL MANAGER</h2>
          <p style="color: #1C1C1A; font-size: 16px;">Hello,</p>
          <p style="color: #1C1C1A; font-size: 16px;">Thank you for registering. Please click the button below to verify your email address and complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="background-color: #1A3A2A; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
          </div>
          <p style="color: #6B6B63; font-size: 14px; text-align: center;">This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #E4E2DA; margin: 20px 0;" />
          <p style="color: #AEADA5; font-size: 12px; text-align: center;">If you didn't request this email, you can safely ignore it.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend error:", emailError);
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Verification email sent!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send verification error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
