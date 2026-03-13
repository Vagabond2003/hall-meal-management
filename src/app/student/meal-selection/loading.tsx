export default function MealSelectionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800 rounded" />
      <div className="flex justify-center">
        <div className="h-10 w-48 bg-slate-100 dark:bg-slate-800 rounded-full" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-white dark:bg-[#182218] border border-slate-100 dark:border-[#2A3A2B] rounded-2xl" />
      ))}
      <div className="h-24 bg-white dark:bg-[#182218] border border-slate-100 dark:border-[#2A3A2B] rounded-2xl" />
    </div>
  );
}
