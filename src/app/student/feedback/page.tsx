import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FeedbackClient from "./FeedbackClient";

export const dynamic = "force-dynamic";

export default async function StudentFeedbackPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "student") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <FeedbackClient />
    </div>
  );
}
