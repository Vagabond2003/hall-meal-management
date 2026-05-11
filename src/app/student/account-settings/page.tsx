import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AccountSettingsClient from "@/components/account/AccountSettingsClient";

export const dynamic = "force-dynamic";

export default async function StudentAccountSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "student") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl">
      <AccountSettingsClient role="student" />
    </div>
  );
}
