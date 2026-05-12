import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { parseOptionalRoomNumber } from "@/lib/roomNumber";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("name, room_number, role")
      .eq("id", session.user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      name: data.name,
      room_number: data.room_number ?? null,
      role: data.role,
    });
  } catch (error) {
    console.error("GET profile error:", error);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, room_number } = body;

    const updatePayload: Record<string, string | null> = {};

    if (name !== undefined) {
      if (!name || String(name).trim() === "") {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      updatePayload.name = String(name).trim();
    }

    if (room_number !== undefined) {
      if (session.user.role !== "student") {
        return NextResponse.json(
          { error: "Only students can update room number here" },
          { status: 400 }
        );
      }
      const parsed = parseOptionalRoomNumber(room_number);
      if (!parsed.ok) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
      }
      updatePayload.room_number = parsed.room;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", session.user.id)
      .select("name, room_number")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      name: data.name,
      room_number: data.room_number ?? null,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
