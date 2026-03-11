import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAdmins() {
  const { data, error } = await supabase
    .from("users")
    .select("email, role")
    .eq("role", "admin");

  if (error) {
    console.error("Error fetching admin:", error);
  } else {
    console.log("Admin users found:", data);
  }
}

checkAdmins().catch(console.error);
