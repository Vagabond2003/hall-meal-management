import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

export default function AdminGlobalLoading() {
  return (
    <div className="flex flex-col gap-6 w-full p-6 h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-6">
        <LoadingSkeleton className="h-10 w-48" />
        <LoadingSkeleton className="h-10 w-32 hidden sm:block" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <LoadingSkeleton key={i} className="h-32 w-full" />)}
      </div>
      <LoadingSkeleton className="h-96 w-full mt-4" />
    </div>
  );
}
