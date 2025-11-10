import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import BackButton from "@/components/BackButton";
import ChatBubble from "@/components/ChatBubble";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  LogOut,
  Users,
  BarChart3,
  Plus,
  Leaf,
  Zap,
  Map,
  MessageCircle,
  Loader,
  User,
  ChevronDown,
} from "lucide-react";
import { seedDemoData } from "@/lib/seedData";

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [communitiesCount, setCommunitiesCount] = useState<number>(0);
  const [actionsCount, setActionsCount] = useState<number>(0);
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-menu]")) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    let profilesChannel: any = null;
    let communitiesChannel: any = null;
    let actionsChannel: any = null;
    let projectsChannel: any = null;

    const checkAndSubscribe = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login");
        return;
      }

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) setUser(profile);

      // Load counts for quick stats (exclude demo data)
      const { data: communitiesData } = await supabase
        .from("communities")
        .select("id")
        .eq("is_demo", false);
      const { data: actionsData } = await supabase
        .from("climate_actions")
        .select("id")
        .eq("is_demo", false);
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id");

      setCommunitiesCount(communitiesData?.length || 0);
      setActionsCount(actionsData?.length || 0);
      setProjectsCount(projectsData?.length || 0);

      // Subscribe to profiles (current user updates)
      profilesChannel = supabase
        .channel(`public:profiles:${authUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${authUser.id}`,
          },
          (payload: any) => {
            const evt = (
              (payload && (payload.event || payload.eventType)) ||
              ""
            ).toUpperCase();
            const newItem = payload?.new as any;
            if ((evt === "UPDATE" || evt === "INSERT") && newItem)
              setUser(newItem);
          },
        )
        .subscribe();

      // Subscribe to communities
      communitiesChannel = supabase
        .channel("public:communities")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "communities" },
          (payload: any) => {
            const evt = (
              (payload && (payload.event || payload.eventType)) ||
              ""
            ).toUpperCase();
            // Only count non-demo data
            const item = payload?.new as any;
            if ((evt === "INSERT" || evt === "UPDATE") && !item?.is_demo) {
              setCommunitiesCount((c) => c + 1);
            } else if (evt === "DELETE") {
              const oldItem = payload?.old as any;
              if (!oldItem?.is_demo) {
                setCommunitiesCount((c) => Math.max(0, c - 1));
              }
            }
          },
        )
        .subscribe();

      // Subscribe to climate_actions
      actionsChannel = supabase
        .channel("public:climate_actions")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "climate_actions" },
          (payload: any) => {
            const evt = (
              (payload && (payload.event || payload.eventType)) ||
              ""
            ).toUpperCase();
            // Only count non-demo data
            const item = payload?.new as any;
            if ((evt === "INSERT" || evt === "UPDATE") && !item?.is_demo) {
              setActionsCount((c) => c + 1);
            } else if (evt === "DELETE") {
              const oldItem = payload?.old as any;
              if (!oldItem?.is_demo) {
                setActionsCount((c) => Math.max(0, c - 1));
              }
            }
          },
        )
        .subscribe();

      // Subscribe to projects
      projectsChannel = supabase
        .channel("public:projects")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "projects" },
          (payload: any) => {
            const evt = (
              (payload && (payload.event || payload.eventType)) ||
              ""
            ).toUpperCase();
            if (evt === "INSERT") setProjectsCount((c) => c + 1);
            else if (evt === "DELETE")
              setProjectsCount((c) => Math.max(0, c - 1));
          },
        )
        .subscribe();

      setLoading(false);
    };

    checkAndSubscribe();

    return () => {
      if (profilesChannel) supabase.removeChannel(profilesChannel);
      if (communitiesChannel) supabase.removeChannel(communitiesChannel);
      if (actionsChannel) supabase.removeChannel(actionsChannel);
      if (projectsChannel) supabase.removeChannel(projectsChannel);
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSeedData = async () => {
    setSeeding(true);
    const result = await seedDemoData();
    if (result.success) {
      alert(
        `Data seed berhasil! ${result.communities} komunitas dan ${result.actions} aksi iklim ditambahkan.`,
      );
    } else {
      const msg =
        typeof result.error === "string"
          ? result.error
          : JSON.stringify(result.error);
      alert(`Gagal seed data: ${msg}`);
      console.error("Seed error details:", result.error);
    }
    setSeeding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 animate-pulse mb-4"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton fallback="/" />
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
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageToggle lang={lang} setLang={setLang} />
            <div className="relative" data-profile-menu>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {user?.username}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-20">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowProfileMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-2 first:rounded-t-lg"
                  >
                    <User className="w-4 h-4" />
                    Profil Saya
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-center gap-2 last:rounded-b-lg text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            {t("welcome")}, {user?.username}! 👋
          </h1>
          <p className="text-muted-foreground text-lg">
            {t("dashboardSubtitle")}
          </p>
        </div>

        {/* Notification Center */}
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-blue-600">
              {t("notificationsLabel") || "Notifikasi"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("noNotifications") || "Tidak ada notifikasi baru saat ini"}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Leaf,
              label: t("actionsLabel"),
              value: actionsCount,
              color: "from-green-500/20 to-green-600/20",
              onClick: undefined,
            },
            {
              icon: Users,
              label: t("communitiesLabel"),
              value: communitiesCount,
              color: "from-blue-500/20 to-blue-600/20",
              onClick: undefined,
            },
            {
              icon: Zap,
              label: t("projectsLabel"),
              value: projectsCount,
              color: "from-yellow-500/20 to-yellow-600/20",
              onClick: undefined,
            },
            {
              icon: BarChart3,
              label: t("analyticsLabel"),
              value: t("viewTrends"),
              color: "from-purple-500/20 to-purple-600/20",
              onClick: () => navigate("/reports"),
            },
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className={`bg-gradient-to-br ${stat.color} border border-border rounded-lg p-6 hover:border-primary transition-colors text-left w-full ${stat.onClick ? "cursor-pointer hover:shadow-lg" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </span>
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-lg font-bold">
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </div>
            </button>
          ))}
        </div>

        {/* Features Section */}
        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Fitur Utama</h2>
            <p className="text-muted-foreground">
              Kelola aksi iklim dan kolaborasi dengan komunitas global
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Map,
                title: "Peta Interaktif Global",
                description:
                  "Visualisasi aksi iklim di seluruh dunia dengan peta Leaflet interaktif, clustering, dan filter real-time",
                action: "Jelajahi Peta",
                navigate: "/communities",
              },
              {
                icon: Users,
                title: "Manajemen Komunitas",
                description:
                  "Kelola anggota komunitas, peran, dan kontribusi dengan sistem terpusat untuk kolaborasi efektif",
                action: "Kelola Komunitas",
                navigate: "/communities",
              },
              {
                icon: MessageCircle,
                title: "Chat Kolaboratif",
                description:
                  "Berkomunikasi real-time dengan anggota komunitas untuk diskusi dan koordinasi proyek",
                action: "Mulai Obrolan",
                navigate: "/communities",
              },
              {
                icon: Zap,
                title: "Pelacakan Proyek",
                description:
                  "Pantau status proyek, target CO2, dan progres dengan dashboard yang mudah digunakan",
                action: "Lihat Proyek",
                navigate: "/projects",
              },
              {
                icon: BarChart3,
                title: "Analitik 3D Komprehensif",
                description:
                  "Dashboard dengan visualisasi 3D, tren waktu, perbandingan regional, dan metrik dampak",
                action: "Lihat Laporan",
                navigate: "/reports",
              },
              {
                icon: Globe,
                title: "Kolaborasi Global",
                description:
                  "Terhubung dengan komunitas di seluruh dunia dan berkolaborasi untuk aksi iklim bersama",
                action: "Jelajahi Komunitas",
                navigate: "/communities",
              },
            ].map((feature) => (
              <button
                key={feature.title}
                onClick={() => navigate(feature.navigate)}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-lg transition-all group text-left"
              >
                <feature.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {feature.description}
                </p>
                <span className="text-xs font-medium text-primary group-hover:underline">
                  {feature.action} →
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Demo Data Section */}
        <section className="mb-8">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-lg p-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Mulai dengan Data Demo
                </h2>
                <p className="text-muted-foreground mb-4">
                  Seed database dengan komunitas contoh dan aksi iklim dari
                  seluruh dunia untuk melihat platform dalam aksi. Data ini
                  membantu Anda menjelajahi semua fitur.
                </p>
                <button
                  onClick={handleSeedData}
                  disabled={seeding}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {seeding ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Seed Data Demo
                    </>
                  )}
                </button>
              </div>
              <div className="hidden md:block">
                <Globe className="w-24 h-24 text-primary/30" />
              </div>
            </div>
          </div>
        </section>
      </main>
      <ChatBubble />
    </div>
  );
}
