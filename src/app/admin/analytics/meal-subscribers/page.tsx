import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MealSubscribersTable from "./MealSubscribersTable";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ month?: string; year?: string }>;
}

export default async function MealSubscribersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "admin") {
    redirect("/login");
  }

  const params = await searchParams;
  const month = Number(params?.month);
  const year = Number(params?.year);

  if (!month || !year || month < 1 || month > 12 || year < 2020 || year > 2100) {
    redirect("/admin/analytics");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  const apiUrl = `${appUrl}/api/admin/analytics/meal-subscribers?month=${month}&year=${year}`;

  const res = await fetch(apiUrl, { cache: "no-store" });

  if (!res.ok) {
    redirect("/admin/analytics");
  }

  const data = await res.json();

  return (
    <MealSubscribersTable
      initialData={data}
      month={month}
      year={year}
    />
  );
}
