import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const { role, is_approved, is_active } = session.user;

  if (!is_active) {
    redirect("/deactivated");
  }

  if (!is_approved) {
    redirect("/pending-approval");
  }

  if (role === "admin") {
    redirect("/admin/dashboard");
  }

  redirect("/student/dashboard");
}
