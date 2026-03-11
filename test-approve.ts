import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, is_approved")
    .eq("role", "student")
    .limit(1);

  console.log("Found student:", data, error);
  
  if (data && data.length > 0) {
    const studentId = data[0].id;
    console.log("Trying to approve student:", studentId);
    
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({ is_approved: true })
      .eq("id", studentId)
      .select()
      .single();
      
    console.log("Update result:", updateData, "Error:", updateError);
  }
}

checkUsers().catch(console.error);
