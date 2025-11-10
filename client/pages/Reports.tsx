import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Globe, Download, ChevronDown } from "lucide-react";
import BackButton from "@/components/BackButton";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationBell from "@/components/NotificationBell";
import ChatBubble from "@/components/ChatBubble";
import { useI18n } from "@/lib/i18n";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import {
  exportAsCSV,
  exportAsXLSX,
  exportAsPDF,
  exportAsImage,
  ExportData,
} from "@/lib/export";
import { toast } from "@/hooks/use-toast";

interface DashboardData {
  metrics: Array<{
    month: string;
    co2_reduction: number;
    actions_completed: number;
    participants: number;
  }>;
  regional: Array<{
    region: string;
    co2_reduction: number;
    impact_percentage: number;
    communities: number;
  }>;
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

export default function Reports() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [timeRange, setTimeRange] = useState<"month" | "quarter" | "year">(
    "month",
  );
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login");
        return;
      }

      await loadRealTimeData();

      // Subscribe to real-time changes
      const actionsChannel = supabase
        .channel("public:climate_actions")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "climate_actions" },
          async () => {
            await loadRealTimeData();
          },
        )
        .subscribe();

      const communitiesChannel = supabase
        .channel("public:communities")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "communities" },
          async () => {
            await loadRealTimeData();
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(actionsChannel);
        supabase.removeChannel(communitiesChannel);
      };
    };

    checkAuthAndLoadData();
  }, [navigate, timeRange]);

  const loadRealTimeData = async () => {
    try {
      setLoading(true);

      // Fetch all real climate actions (both active and demo for analytics visibility)
      const { data: actionsData, error: actionsError } = await supabase
        .from("climate_actions")
        .select("*");

      if (actionsError) throw actionsError;

      // Fetch all communities
      const { data: communitiesData, error: communitiesError } = await supabase
        .from("communities")
        .select("*");

      if (communitiesError) {
        console.warn("Failed to load communities:", communitiesError);
      }

      // Group actions by month and region from real data
      const monthlyMetrics: Record<string, any> = {};
      const regionalData: Record<string, any> = {};
      let totalCo2 = 0;
      let totalParticipants = 0;
      let totalCommunities = new Set<string>();
      let totalActions = 0;

      // Initialize months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString("default", { month: "short" });
        monthlyMetrics[monthName] = {
          month: monthName,
          co2_reduction: 0,
          actions_completed: 0,
          participants: new Set<string>(),
        };
      }

      // Process climate actions with real data
      (actionsData || []).forEach((action: any) => {
        const createdDate = new Date(action.created_at);
        const monthName = createdDate.toLocaleString("default", {
          month: "short",
        });

        // Add to monthly metrics
        if (monthlyMetrics[monthName]) {
          monthlyMetrics[monthName].co2_reduction += Number(
            action.impact_co2_saved || 0,
          );
          monthlyMetrics[monthName].actions_completed += 1;
          if (action.creator_id) {
            monthlyMetrics[monthName].participants.add(action.creator_id);
          }
        }

        // Add to totals
        totalCo2 += Number(action.impact_co2_saved || 0);
        totalActions += 1;

        // Add to regional data
        const region = action.location_name || "Unknown";
        if (!regionalData[region]) {
          regionalData[region] = {
            region,
            co2_reduction: 0,
            communities: new Set(),
            impact_percentage: 0,
          };
        }
        regionalData[region].co2_reduction += Number(
          action.impact_co2_saved || 0,
        );
      });

      // Process communities
      (communitiesData || []).forEach((community: any) => {
        if (community && community.id) {
          totalCommunities.add(community.id);
          totalParticipants += Number(community.member_count || 0);
          const region = community.location_name || "Unknown";
          if (regionalData[region]) {
            regionalData[region].communities.add(community.id);
          }
        }
      });

      // Convert monthly metrics to array format
      const months = Object.values(monthlyMetrics).map((m: any) => ({
        month: m.month,
        co2_reduction: m.co2_reduction,
        actions_completed: m.actions_completed,
        participants: m.participants.size,
      }));

      // Calculate action types from real data
      const actionTypes: Record<string, number> = {};
      const actionTypeCounts: Record<string, number> = {};
      (actionsData || []).forEach((action: any) => {
        const type = action.action_type || "Other";
        actionTypes[type] =
          (actionTypes[type] || 0) + Number(action.impact_co2_saved || 0);
        actionTypeCounts[type] = (actionTypeCounts[type] || 0) + 1;
      });

      const actionTypesList = Object.entries(actionTypes)
        .map(([name, value]) => ({
          name: String(name).charAt(0).toUpperCase() + String(name).slice(1),
          value: Number(value) as number,
          percentage: 0,
        }))
        .sort((a, b) => b.value - a.value);

      // Calculate percentages safely
      const totalValue = actionTypesList.reduce(
        (sum, a) => sum + (Number(a.value) || 0),
        0,
      );
      actionTypesList.forEach((a) => {
        a.percentage =
          totalValue > 0 ? Math.round((Number(a.value) / totalValue) * 100) : 0;
      });

      // Convert regional data to array and calculate percentages safely
      const regionalArray = Object.values(regionalData)
        .map((r: any) => ({
          region: r.region,
          co2_reduction: r.co2_reduction,
          impact_percentage:
            totalCo2 > 0 ? Math.round((r.co2_reduction / totalCo2) * 100) : 0,
          communities: r.communities.size,
        }))
        .sort((a, b) => b.co2_reduction - a.co2_reduction);

      setDashboardData({
        metrics: months,
        regional: regionalArray,
        actionTypes: actionTypesList,
        totalImpact: {
          co2_reduction: Math.round(totalCo2),
          participants: totalParticipants,
          communities: totalCommunities.size,
        },
      });
    } catch (err) {
      const errorMessage =
        err && (err as any).message
          ? (err as any).message
          : typeof err === "string"
            ? err
            : JSON.stringify(err, Object.getOwnPropertyNames(err));

      console.error("Error loading real-time data:", err);
      toast({
        title: "Error loading data",
        description: errorMessage || "Failed to load real-time analytics data",
      });
      setDashboardData({
        metrics: [],
        regional: [],
        actionTypes: [],
        totalImpact: { co2_reduction: 0, participants: 0, communities: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf" | "image") => {
    if (!dashboardData) {
      toast({
        title: t("exportNoDataTitle"),
        description: t("exportNoDataDesc"),
      });
      return;
    }

    setExporting(true);
    try {
      const exportData: ExportData = dashboardData;
      const fileName = `climate-report-${timeRange}`;

      switch (format) {
        case "csv":
          await exportAsCSV(exportData, fileName);
          toast({
            title: t("exportSuccessTitle"),
            description: t("exportCSVDesc"),
          });
          break;
        case "xlsx":
          await exportAsXLSX(exportData, fileName);
          toast({
            title: t("exportSuccessTitle"),
            description: t("exportXLSXDesc"),
          });
          break;
        case "pdf":
          await exportAsPDF(exportData, fileName);
          toast({
            title: t("exportSuccessTitle"),
            description: t("exportPDFDesc"),
          });
          break;
        case "image":
          await exportAsImage("dashboard-content", fileName);
          toast({
            title: t("exportSuccessTitle"),
            description: t("exportImageDesc"),
          });
          break;
      }
      setShowExportMenu(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: t("exportFailedTitle"),
        description: String(error),
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton fallback="/dashboard" />
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fedee6dbdb7b64837ae037addcd2dafdc%2F1c33dd3c179341e49fcbc665d4045f39?format=webp&width=80"
                alt="CivicSphere"
                className="w-8 h-8 rounded-md object-cover"
              />
              <span className="text-xl font-bold text-primary">
                CivicSphere
              </span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} setLang={setLang} />
            <NotificationBell />
            <select
              value={timeRange}
              onChange={(e) =>
                setTimeRange(e.target.value as "month" | "quarter" | "year")
              }
              className="px-3 py-2 rounded-lg bg-muted border border-border text-sm font-medium hover:bg-muted/80 transition-colors cursor-pointer"
            >
              <option value="month">{t("timeMonth")}</option>
              <option value="quarter">{t("timeQuarter")}</option>
              <option value="year">{t("timeYear")}</option>
            </select>
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                {t("exportReport")}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => handleExport("csv")}
                    disabled={exporting}
                    className="block w-full text-left px-4 py-2 hover:bg-muted transition-colors first:rounded-t-lg disabled:opacity-50"
                  >
                    📊 {t("exportAsCSV")}
                  </button>
                  <button
                    onClick={() => handleExport("xlsx")}
                    disabled={exporting}
                    className="block w-full text-left px-4 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    📈 {t("exportAsXLSX")}
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    disabled={exporting}
                    className="block w-full text-left px-4 py-2 hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    📄 {t("exportAsPDF")}
                  </button>
                  <button
                    onClick={() => handleExport("image")}
                    disabled={exporting}
                    className="block w-full text-left px-4 py-2 hover:bg-muted transition-colors last:rounded-b-lg disabled:opacity-50"
                  >
                    🖼️ {t("exportAsImage")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("reportsTitle")}</h1>
          <p className="text-muted-foreground">{t("reportsSubtitle")}</p>
        </div>

        <div id="dashboard-content">
          <AnalyticsDashboard
            loading={loading}
            data={dashboardData || undefined}
          />
        </div>
      </main>
      <ChatBubble />
    </div>
  );
}
