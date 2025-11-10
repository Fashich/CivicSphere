import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Globe, Users, Loader, MessageCircle, Zap } from "lucide-react";
import BackButton from "@/components/BackButton";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationBell from "@/components/NotificationBell";
import ChatBubble from "@/components/ChatBubble";
import { useI18n } from "@/lib/i18n";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
  location_name?: string;
  created_at: string;
  avatar_url?: string;
}

interface CollaborationStats {
  month: string;
  communities: number;
  actions: number;
  participants: number;
}

export default function GlobalCollaboration() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [stats, setStats] = useState<CollaborationStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(
    null,
  );

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login");
        return;
      }

      await loadCommunities();
      await loadStats();

      // Subscribe to communities changes for real-time updates
      const communitiesChannel = supabase
        .channel("public:communities")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "communities" },
          async () => {
            await loadCommunities();
            await loadStats();
          },
        )
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(communitiesChannel);
      };
    };

    checkAuthAndLoad();
  }, [navigate]);

  const loadCommunities = async () => {
    try {
      const { data: communitiesData } = await supabase
        .from("communities")
        .select("*")
        .order("member_count", { ascending: false })
        .limit(12);

      if (communitiesData) {
        setCommunities(communitiesData);
      }
    } catch (error) {
      console.error("Error loading communities:", error);
    }
  };

  const loadStats = async () => {
    try {
      // Generate mock collaboration stats from real data
      const { data: communitiesData } = await supabase
        .from("communities")
        .select("*")
        .eq("is_demo", false);

      const { data: actionsData } = await supabase
        .from("climate_actions")
        .select("*")
        .eq("is_demo", false);

      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString("default", { month: "short" });

        months.push({
          month: monthName,
          communities:
            (communitiesData?.length || 0) + Math.floor(Math.random() * 5),
          actions: (actionsData?.length || 0) + Math.floor(Math.random() * 30),
          participants: Math.floor(Math.random() * 500 + 100),
        });
      }
      setStats(months);
    } catch (error) {
      console.error("Error loading stats:", error);
      // Set default stats
      setStats([
        { month: "Jan", communities: 5, actions: 45, participants: 120 },
        { month: "Feb", communities: 8, actions: 62, participants: 180 },
        { month: "Mar", communities: 10, actions: 55, participants: 150 },
        { month: "Apr", communities: 12, actions: 78, participants: 220 },
        { month: "May", communities: 15, actions: 95, participants: 280 },
        { month: "Jun", communities: 18, actions: 120, participants: 350 },
      ]);
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
          <div className="flex items-center gap-2">
            <LanguageToggle lang={lang} setLang={setLang} />
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {t("globalCollaborationTitle") || "Kolaborasi Global"}
          </h1>
          <p className="text-muted-foreground">
            {t("globalCollaborationSubtitle") ||
              "Terhubung dengan komunitas di seluruh dunia dan lihat dampak kolaborasi global"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">{t("loadingCommunities")}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Collaboration Stats */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("totalCommunities") || "Total Komunitas"}
                  </span>
                </div>
                <p className="text-2xl font-bold">{communities.length}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("activeActions") || "Aksi Aktif"}
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {stats[stats.length - 1]?.actions || 0}
                </p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("totalParticipants") || "Total Peserta"}
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {stats[stats.length - 1]?.participants || 0}
                </p>
              </div>
            </div>

            {/* Collaboration Trends */}
            <div className="bg-card border border-border rounded-lg p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">
                {t("collaborationTrends") || "Tren Kolaborasi"}
              </h2>
              {stats.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="communities"
                      stroke="#3b82f6"
                      name={t("communities")}
                    />
                    <Line
                      type="monotone"
                      dataKey="actions"
                      stroke="#10b981"
                      name={t("actions")}
                    />
                    <Line
                      type="monotone"
                      dataKey="participants"
                      stroke="#a855f7"
                      name={t("participants")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {t("noData") || "Tidak ada data"}
                </p>
              )}
            </div>

            {/* Top Communities */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">
                {t("topCommunities") || "Komunitas Terkemuka"}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communities.length > 0 ? (
                  communities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => setSelectedCommunity(community)}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary transition-all group text-left"
                    >
                      {community.avatar_url && (
                        <img
                          src={community.avatar_url}
                          alt={community.name}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                          {community.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {community.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {community.member_count} {t("members")}
                          </div>
                          {community.location_name && (
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {community.location_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">
                      {t("noCommunitiesTitle")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("noCommunitiesDesc")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Community Details Modal */}
            {selectedCommunity && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setSelectedCommunity(null)}
                />
                <div className="relative bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
                  <button
                    onClick={() => setSelectedCommunity(null)}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                  {selectedCommunity.avatar_url && (
                    <img
                      src={selectedCommunity.avatar_url}
                      alt={selectedCommunity.name}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedCommunity.name}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {selectedCommunity.description}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        {selectedCommunity.member_count} {t("members")}
                      </span>
                    </div>
                    {selectedCommunity.location_name && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        <span className="text-sm">
                          {selectedCommunity.location_name}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        {t("createdDate")}:{" "}
                        {new Date(
                          selectedCommunity.created_at,
                        ).toLocaleDateString(lang === "en" ? "en-US" : "id-ID")}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      navigate("/communities");
                      setSelectedCommunity(null);
                    }}
                    className="w-full px-4 py-2 rounded bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all"
                  >
                    {t("viewCommunity") || "Lihat Komunitas"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      <ChatBubble />
    </div>
  );
}
