import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const BATCH_SIZE = 100;
const TOTAL_CODES = 400;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALLOWED_CHARS[Math.floor(Math.random() * ALLOWED_CHARS.length)];
  }
  return code;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminId = session.user.id;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch existing codes to avoid duplicates
    const { data: existingCodes } = await supabaseAdmin
      .from("invite_codes")
      .select("code");

    const existingSet = new Set(existingCodes?.map((c) => c.code) || []);

    // Generate unique codes
    const codes: string[] = [];
    let attempts = 0;
    const maxAttempts = TOTAL_CODES * 10;

    while (codes.length < TOTAL_CODES && attempts < maxAttempts) {
      const code = generateCode();
      if (!existingSet.has(code) && !codes.includes(code)) {
        codes.push(code);
        existingSet.add(code);
      }
      attempts++;
    }

    if (codes.length < TOTAL_CODES) {
      return NextResponse.json(
        { message: "Failed to generate enough unique codes. Please try again." },
        { status: 500 }
      );
    }

    // Insert in batches of 100
    let totalInserted = 0;
    for (let i = 0; i < codes.length; i += BATCH_SIZE) {
      const batch = codes.slice(i, i + BATCH_SIZE).map((code) => ({
        code,
        created_by: adminId,
        expires_at: expiresAt,
      }));

      const { error } = await supabaseAdmin
        .from("invite_codes")
        .insert(batch);

      if (error) {
        console.error(`Batch insert error (batch ${i / BATCH_SIZE + 1}):`, error);
        return NextResponse.json(
          { message: "Failed to generate invite codes. Some may have been created." },
          { status: 500 }
        );
      }

      totalInserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      count: totalInserted,
    });
  } catch (error) {
    console.error("Generate invite codes error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
