import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role, rna_number, admin_secret_code } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (role === "admin") {
      // Validate admin secret code
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
    } else if (role === "student") {
      // RNA number validation for students
      if (!rna_number) {
        return NextResponse.json(
          { message: "RNA number is required for students" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ message: "Invalid role" }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const isApproved = role === "admin"; // Admins are auto-approved, students must wait

    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      rna_number: role === "student" ? rna_number : null,
      is_approved: isApproved,
      is_active: true,
      meal_selection_enabled: true,
    };

    const { error } = await supabaseAdmin.from("users").insert(userData);

    if (error) {
      console.error("Supabase insert error:", error);
      // Handle unique constraint violation for RNA number just in case
      if (error.code === "23505" && error.message.includes("rna_number")) {
        return NextResponse.json(
          { message: "This RNA number is already registered" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
