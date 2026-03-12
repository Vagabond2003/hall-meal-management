"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  UtensilsCrossed,
  DollarSign,
  CalendarDays
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";

type AnalyticsData = {
  stats: {
    totalMeals: number;
    totalRevenue: number;
    activeStudents: number;
    avgMealsPerStudent: number;
  };
  dailyParticipation: { day: number; count: number }[];
  popularMeals: { name: string; count: number }[];
  monthlyRevenue: { month: string; revenue: number }[];
  studentGrowth: { month: string; count: number }[];
};

const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border p-3 rounded-lg shadow-sm font-sans">
        <p className="text-sm font-medium text-text-primary mb-1">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatter ? formatter(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const fetchAnalytics = async (month: number, year: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?month=${month}&year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(i);
      return { value: i + 1, label: d.toLocaleString('default', { month: 'long' }) };
    });
  }, []);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-8"
    >
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-text-primary">Analytics</h1>
          <p className="mt-1 text-text-secondary text-sm font-sans">
            Insights and trends for hall meal management
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-surface border border-border/50 text-text-primary text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-primary shadow-sm font-sans"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-surface border border-border/50 text-text-primary text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-primary shadow-sm font-sans"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && data && (
        <div className="opacity-50 pointer-events-none transition-opacity">
          {/* Faded state while refetching */}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Meals This Month"
          value={data?.stats.totalMeals || 0}
          icon={<UtensilsCrossed className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-muted"
          delay={100}
        />
        <StatCard
          label="Total Revenue This Month"
          value={data?.stats.totalRevenue || 0}
          prefix="৳"
          icon={<DollarSign className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-muted"
          delay={200}
        />
        <StatCard
          label="Active Students"
          value={data?.stats.activeStudents || 0}
          icon={<Users className="w-5 h-5 text-primary" />}
          iconBg="bg-primary-muted"
          delay={300}
        />
        <StatCard
          label="Avg Meals Per Student"
          value={data?.stats.avgMealsPerStudent || 0}
          icon={<TrendingUp className="w-5 h-5 text-accent" />}
          iconBg="bg-accent-light"
          delay={400}
          isText={true} // Decimals might look weird with countUp right out of the box
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Daily Participation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-surface rounded-[16px] border border-border/50 p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-sans font-semibold text-text-primary">Daily Meal Participation</h2>
          </div>
          {data?.dailyParticipation && data.dailyParticipation.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.dailyParticipation} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E2DA" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6B6B63", fontSize: 12 }} 
                    tickFormatter={(v) => `${v}`}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6B6B63", fontSize: 12 }} 
                  />
                  <Tooltip 
                    content={<CustomTooltip labelFormatter={(l: any) => `Day ${l}`} formatter={(v: any) => [v, "Students"]} />} 
                    cursor={{ fill: "#EAF2EC" }} 
                  />
                  <Bar dataKey="count" fill="#1A3A2A" radius={[4, 4, 0, 0]} name="Students" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <EmptyState 
                icon={<CalendarDays className="w-8 h-8 opacity-20" />}
                title="No Data Yet" 
                description="No meals recorded for this month."
              />
            </div>
          )}
        </motion.div>

        {/* Popular Meals */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="bg-surface rounded-[16px] border border-border/50 p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-sans font-semibold text-text-primary">Most Popular Meals</h2>
          </div>
          {data?.popularMeals && data.popularMeals.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data.popularMeals} 
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E4E2DA" />
                  <XAxis 
                    type="number"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6B6B63", fontSize: 12 }} 
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#1C1C1A", fontSize: 12, fontWeight: 500 }}
                    width={100}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={(v: any) => [v, "Selections"]} />} 
                    cursor={{ fill: "#FDF3E3" }} 
                  />
                  <Bar dataKey="count" fill="#C4873A" radius={[0, 4, 4, 0]} name="Selections" barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <EmptyState 
                icon={<UtensilsCrossed className="w-8 h-8 opacity-20" />}
                title="No Meal Data" 
                description="No meals have been selected yet."
              />
            </div>
          )}
        </motion.div>

        {/* Monthly Revenue Trend */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="bg-surface rounded-[16px] border border-border/50 p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-sans font-semibold text-text-primary">Monthly Revenue Trend (Last 6 Months)</h2>
          </div>
          {data?.monthlyRevenue && data.monthlyRevenue.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyRevenue} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E2DA" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6B6B63", fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6B6B63", fontSize: 12 }} 
                    tickFormatter={(v) => `৳${v}`}
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={(v: any) => [`৳${v}`, "Revenue"]} />} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2E7D52" 
                    strokeWidth={3} 
                    dot={{ fill: "#2E7D52", strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Revenue" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div className="h-[300px] flex items-center justify-center">
               <EmptyState 
                 icon={<BarChart2 className="w-8 h-8 opacity-20" />}
                 title="No History" 
                 description="No revenue history available."
               />
             </div>
          )}
        </motion.div>

        {/* Student Signups Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="bg-surface rounded-[16px] border border-border/50 p-6 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-sans font-semibold text-text-primary">Student Signups Over Time</h2>
          </div>
          {data?.studentGrowth && data.studentGrowth.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.studentGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1A3A2A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1A3A2A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4E2DA" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6B6B63", fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#6B6B63", fontSize: 12 }} 
                  />
                  <Tooltip 
                    content={<CustomTooltip formatter={(v: any) => [v, "Total Students"]} />} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#1A3A2A" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorStudents)" 
                    name="Total Students" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <EmptyState 
                icon={<Users className="w-8 h-8 opacity-20" />}
                title="No Data" 
                description="No student signups yet."
              />
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}
