import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AdminLayoutGuard } from "@/components/layout/AdminLayoutGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutGuard>
      <div className="min-h-screen bg-slate-50 flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300">
          <Topbar />
          <main className="flex-1 p-4 lg:p-8 animate-fade-in pb-20 lg:pb-8">
            {children}
          </main>
        </div>
      </div>
    </AdminLayoutGuard>
  );
}
