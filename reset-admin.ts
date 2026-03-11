import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function resetAdminPassword() {
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from("users")
    .update({ password: hashedPassword })
    .eq("email", "admin1@gmail.com")
    .select();

  if (error) {
    console.error("Failed to reset password:", error);
  } else {
    console.log("Admin password reset successfully for admin1@gmail.com to:", password);
  }
}

resetAdminPassword().catch(console.error);
