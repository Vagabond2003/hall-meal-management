export default function StudentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white dark:bg-[#182218] border border-slate-100 dark:border-[#2A3A2B] rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-white dark:bg-[#182218] border border-slate-100 dark:border-[#2A3A2B] rounded-2xl" />
    </div>
  );
}
