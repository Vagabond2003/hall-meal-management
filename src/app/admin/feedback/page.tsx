import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedbackAdminClient from "./FeedbackAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <FeedbackAdminClient />
    </div>
  );
}
