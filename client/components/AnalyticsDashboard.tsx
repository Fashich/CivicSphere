import React, { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { TrendingUp, TrendingDown, Globe, Zap, Leaf } from "lucide-react";

interface MetricsData {
  month: string;
  co2_reduction: number;
  actions_completed: number;
  participants: number;
  tree_planted?: number;
}

interface RegionalData {
  region: string;
  co2_reduction: number;
  impact_percentage: number;
  communities: number;
}

interface DashboardData {
  metrics: MetricsData[];
  regional: RegionalData[];
  actionTypes: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  totalImpact: {
    co2_reduction: number;
    participants: number;
    communities: number;
  };
}

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-xs">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsDashboard: React.FC<{
  data?: DashboardData;
  loading?: boolean;
}> = ({
  data = {
    metrics: [
      {
        month: "Jan",
        co2_reduction: 1200,
        actions_completed: 45,
        participants: 120,
      },
      {
        month: "Feb",
        co2_reduction: 1900,
        actions_completed: 62,
        participants: 180,
      },
      {
        month: "Mar",
        co2_reduction: 1500,
        actions_completed: 55,
        participants: 150,
      },
      {
        month: "Apr",
        co2_reduction: 2200,
        actions_completed: 78,
        participants: 220,
      },
      {
        month: "May",
        co2_reduction: 2800,
        actions_completed: 95,
        participants: 280,
      },
      {
        month: "Jun",
        co2_reduction: 3200,
        actions_completed: 120,
        participants: 350,
      },
    ],
    regional: [
      {
        region: "Asia Tenggara",
        co2_reduction: 8500,
        impact_percentage: 35,
        communities: 45,
      },
      {
        region: "Asia Selatan",
        co2_reduction: 6200,
        impact_percentage: 25,
        communities: 32,
      },
      {
        region: "Afrika",
        co2_reduction: 4100,
        impact_percentage: 17,
        communities: 28,
      },
      {
        region: "Amerika",
        co2_reduction: 3200,
        impact_percentage: 13,
        communities: 20,
      },
      {
        region: "Eropa",
        co2_reduction: 1900,
        impact_percentage: 8,
        communities: 15,
      },
    ],
    actionTypes: [
      { name: "Energi Terbarukan", value: 4500, percentage: 30 },
      { name: "Reboisasi", value: 3800, percentage: 25 },
      { name: "Transportasi", value: 2800, percentage: 18 },
      { name: "Pengelolaan Limbah", value: 2400, percentage: 16 },
      { name: "Pertanian", value: 1500, percentage: 10 },
    ],
    totalImpact: {
      co2_reduction: 24000,
      participants: 1200,
      communities: 140,
    },
  },
  loading = false,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 animate-pulse mb-4"></div>
          <p className="text-muted-foreground">Memuat analitik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Total CO2 Berkurang
            </span>
            <TrendingDown className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {data.totalImpact.co2_reduction.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.metrics[
              data.metrics.length - 1
            ]?.co2_reduction.toLocaleString() || 0}{" "}
            kg bulan ini
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Peserta Aktif
            </span>
            <Zap className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {data.totalImpact.participants.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Di {data.totalImpact.communities.toLocaleString()} komunitas global
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Komunitas Aktif
            </span>
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {data.totalImpact.communities}
          </div>
          <p className="text-xs text-muted-foreground">
            Tersebar di berbagai negara
          </p>
        </div>
      </div>

      {/* Trend Chart - CO2 Reduction Over Time */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Tren Pengurangan CO2</h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.metrics}>
            <defs>
              <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="co2_reduction"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorCo2)"
              name="CO2 Berkurang (kg)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Multiple Metrics Chart */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Ringkasan Metrik Bulanan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data.metrics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="actions_completed"
              fill="#3b82f6"
              name="Aksi Selesai"
            />
            <Line
              type="monotone"
              dataKey="participants"
              stroke="#10b981"
              name="Peserta"
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Regional Comparison */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Regional Bar Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">
            Perbandingan Dampak Regional
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.regional}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="region" stroke="#94a3b8" angle={-45} />
              <YAxis stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="co2_reduction"
                fill="#10b981"
                name="CO2 Berkurang (kg)"
              />
              <Bar dataKey="communities" fill="#3b82f6" name="Komunitas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Pie Chart */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Distribusi Dampak Regional</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.regional}
                dataKey="impact_percentage"
                nameKey="region"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.regional.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Types Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Distribusi Tipe Aksi</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.actionTypes}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {data.actionTypes.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Action Types List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4">Detail Tipe Aksi</h2>
          <div className="space-y-3">
            {data.actionTypes.map((action, index) => (
              <div
                key={action.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm font-medium">{action.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {action.value.toLocaleString()} kg
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {action.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
