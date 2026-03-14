import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    // Look up user by email
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, email, name")
      .eq("email", email.toLowerCase().trim())
      .single();

    // Always return 200 for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a secure random token
    const token = crypto.randomUUID();

    // expires_at = now + 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Invalidate any existing unused tokens for this user
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("user_id", user.id)
      .eq("used", false);

    // Save new token
    const { error: insertError } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({ user_id: user.id, token, expires_at: expiresAt });

    if (insertError) throw insertError;

    const resetLink = `https://hall-meal-management.vercel.app/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: `"Hall Meal Management" <hallmealmanager@gmail.com>`,
        to: user.email,
        subject: "Reset your password",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
            <title>Reset Your Password</title>
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
                        <h1 style="margin:8px 0 0;font-size:24px;color:#ffffff;font-weight:700;">Password Reset</h1>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <p style="margin:0 0 16px;font-size:16px;color:#4A5568;">Hi ${user.name},</p>
                        <p style="margin:0 0 24px;font-size:15px;color:#6B6B63;line-height:1.6;">
                          We received a request to reset the password for your Hall Meal Management account.
                          Click the button below to set a new password. This link expires in <strong style="color:#1A3A2A;">1 hour</strong>.
                        </p>
                        <!-- CTA Button -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding:8px 0 32px;">
                              <a href="${resetLink}"
                                 style="display:inline-block;background-color:#1A3A2A;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
                                Reset My Password
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="margin:0 0 8px;font-size:13px;color:#AEADA5;">If the button doesn't work, copy and paste this link into your browser:</p>
                        <p style="margin:0 0 32px;font-size:12px;word-break:break-all;">
                          <a href="${resetLink}" style="color:#C4873A;">${resetLink}</a>
                        </p>
                        <hr style="border:none;border-top:1px solid #E4E2DA;margin:0 0 24px;"/>
                        <p style="margin:0;font-size:13px;color:#AEADA5;line-height:1.6;">
                          If you didn't request a password reset, you can safely ignore this email.
                          Your password will not change.
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
      console.error("Failed to send reset email:", emailError);
      return NextResponse.json(
        { error: "Failed to send reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    // Still return 200 for security on general errors, but we might want to change this long term. User didn't request a change here.
    return NextResponse.json({ success: true });
  }
}
