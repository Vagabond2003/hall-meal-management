import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <StudentSidebar />
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0 transition-all duration-300">
        <Topbar />
        <main className="flex-1 p-4 lg:p-8 animate-fade-in pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
