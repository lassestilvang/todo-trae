'use client';

import { useEffect, useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, CheckCircle2, Clock, List, Tag, 
  ArrowUpRight, ArrowDownRight, Activity, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Sidebar } from '@/components/Sidebar';
import { CustomCursor } from '@/components/CustomCursor';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';

interface AnalyticsData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    activeTasks: number;
  };
  productivityTrend: {
    date: string;
    completed: number;
    created: number;
  }[];
  tasksByList: {
    name: string;
    count: number;
    color: string;
  }[];
  tasksByLabel: {
    name: string;
    count: number;
    color: string;
  }[];
  timeSpentByList: {
    name: string;
    minutes: number;
    color: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/analytics');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <AuthProvider>
      <ThemeProvider>
        <div className="flex h-screen bg-background text-foreground selection:bg-primary/20">
          <CustomCursor />
          <Sidebar />
          
          <main className="flex-1 overflow-y-auto p-8 bg-background/40 backdrop-blur-3xl">
            <header className="mb-8">
              <h1 className="text-3xl font-black tracking-tight mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Productivity Analytics
              </h1>
              <p className="text-muted-foreground">Visualize your progress and optimize your workflow.</p>
            </header>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { 
                  label: 'Total Tasks', 
                  value: data.summary.totalTasks, 
                  icon: List, 
                  color: 'text-blue-500', 
                  bg: 'bg-blue-500/10' 
                },
                { 
                  label: 'Completed', 
                  value: data.summary.completedTasks, 
                  icon: CheckCircle2, 
                  color: 'text-emerald-500', 
                  bg: 'bg-emerald-500/10' 
                },
                { 
                  label: 'Completion Rate', 
                  value: `${data.summary.completionRate.toFixed(1)}%`, 
                  icon: TrendingUp, 
                  color: 'text-amber-500', 
                  bg: 'bg-amber-500/10' 
                },
                { 
                  label: 'Active Tasks', 
                  value: data.summary.activeTasks, 
                  icon: Activity, 
                  color: 'text-purple-500', 
                  bg: 'bg-purple-500/10' 
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 rounded-2xl bg-card/40 border border-border/30 backdrop-blur-md hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Productivity Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-8 rounded-3xl bg-card/40 border border-border/30 backdrop-blur-md mb-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black mb-1 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Productivity Trend
                  </h3>
                  <p className="text-sm text-muted-foreground">Tasks created vs completed over the last 30 days.</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.productivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                      tickFormatter={(str) => new Date(str).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#10B981" 
                      strokeWidth={4} 
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="created" 
                      stroke="#3B82F6" 
                      strokeWidth={4} 
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Tasks by List */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="p-8 rounded-3xl bg-card/40 border border-border/30 backdrop-blur-md"
              >
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <List className="w-5 h-5 text-primary" />
                  Tasks by List
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.tasksByList} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold' }}
                        width={100}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      />
                      <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                        {data.tasksByList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Time Allocation */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="p-8 rounded-3xl bg-card/40 border border-border/30 backdrop-blur-md"
              >
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Time Allocation (min)
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.timeSpentByList}
                        dataKey="minutes"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {data.timeSpentByList.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Tasks by Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 p-8 rounded-3xl bg-card/40 border border-border/30 backdrop-blur-md"
            >
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                Tasks by Label
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.tasksByLabel}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 'bold' }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: 'rgba(10, 10, 10, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {data.tasksByLabel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </main>
        </div>
      </ThemeProvider>
    </AuthProvider>
  );
}
