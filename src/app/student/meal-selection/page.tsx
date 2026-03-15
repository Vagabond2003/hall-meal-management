import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MealSelectionClient from "./MealSelectionClient";

export const dynamic = "force-dynamic";

export default async function MealSelectionPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  return <MealSelectionClient />;
}
