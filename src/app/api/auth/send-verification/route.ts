import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { transporter } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    // Check SMTP credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables");
      return NextResponse.json(
        { message: "Email service is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { email } = body;

    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // Generate token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Save token to email_verification_tokens
    const { error: insertError } = await supabaseAdmin
      .from("email_verification_tokens")
      .insert({
        email: normalizedEmail,
        token,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Failed to save verification token:", insertError);
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 }
      );
    }

    const verificationLink = `https://hall-meal-management.vercel.app/complete-registration?token=${token}`;

    // Send email using nodemailer
    try {
      await transporter.sendMail({
        from: `"Hall Meal Management" <${process.env.GMAIL_USER}>`,
        to: normalizedEmail,
        subject: "Verify your email to create your account",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Verify Your Email</title>
          </head>
          <body style="margin:0;padding:0;background-color:#F7F6F2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F6F2;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">
                    <!-- Header -->
                    <tr>
                      <td style="background-color:#1A3A2A;padding:32px 40px;text-align:center;">
                        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4873A;font-weight:600;">Online Hall Meal Management</p>
                        <h1 style="margin:8px 0 0;font-size:24px;color:#ffffff;font-weight:700;">Verify Your Email</h1>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 16px;font-size:16px;color:#4A5568;">Hello,</p>
                        <p style="margin:0 0 24px;font-size:15px;color:#6B6B63;line-height:1.6;">
                          Thank you for signing up for Hall Meal Management. Please verify your email address by clicking the button below to continue creating your account. This link expires in <strong style="color:#1A3A2A;">1 hour</strong>.
                        </p>
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:8px 0 32px;">
                              <a href="${verificationLink}"
                                 style="display:inline-block;background-color:#1A3A2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                                Verify My Email
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0 0 8px;font-size:13px;color:#AEADA5;">If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="margin:0 0 32px;font-size:12px;word-break:break-all;">
                          <a href="${verificationLink}" style="color:#C4873A;">${verificationLink}</a>
                        </p>
                        <hr style="border:none;border-top:1px solid #E4E2DA;margin:0 0 24px;"/>
                        <p style="margin:0;font-size:13px;color:#AEADA5;line-height:1.6;">
                          If you didn't request this, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#F0EFE9;padding:20px 40px;text-align:center;">
                        <p style="margin:0;font-size:12px;color:#AEADA5;">
                          © ${new Date().getFullYear()} Online Hall Meal Management System — Confidential
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return NextResponse.json(
        { message: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Verification email sent successfully" },
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
