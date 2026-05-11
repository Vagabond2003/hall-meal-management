import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import BillingClient from "./BillingClient";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <BillingClient />
    </div>
  );
}
