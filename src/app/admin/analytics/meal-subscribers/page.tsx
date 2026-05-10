import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMealSubscribers } from "@/lib/analytics/getMealSubscribers";
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

  const data = await getMealSubscribers(month, year);

  return (
    <MealSubscribersTable
      initialData={data}
      month={month}
      year={year}
    />
  );
}
