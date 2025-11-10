import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, Loader } from "lucide-react";
import BackButton from "@/components/BackButton";
import LanguageToggle from "@/components/LanguageToggle";
import ChatBubble from "@/components/ChatBubble";
import { useI18n } from "@/lib/i18n";
import { MapView } from "@/components/MapView";

interface ClimateAction {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  action_type: string;
  impact_co2_saved?: number;
  location_name?: string;
  status?: string;
  community_id?: string;
  created_at?: string;
}

export default function GlobalMap() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [climateActions, setClimateActions] = useState<ClimateAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<ClimateAction | null>(
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

      await loadClimateActions();

      // Subscribe to climate_actions changes for real-time updates
      const actionsChannel = supabase
        .channel("public:climate_actions")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "climate_actions" },
          async () => {
            await loadClimateActions();
          },
        )
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(actionsChannel);
      };
    };

    checkAuthAndLoad();
  }, [navigate]);

  const loadClimateActions = async () => {
    try {
      const { data: actionsData } = await supabase
        .from("climate_actions")
        .select("*")
        .eq("status", "active")
        .eq("is_demo", false);

      if (actionsData) {
        setClimateActions(actionsData);
      }
    } catch (error) {
      console.error("Error loading climate actions:", error);
    }
  };

  const filteredActions =
    filterType === "all"
      ? climateActions
      : climateActions.filter((a) => a.action_type === filterType);

  const actionTypes = Array.from(
    new Set(climateActions.map((a) => a.action_type)),
  );

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">
            {t("globalMapTitle") || "Peta Interaktif Global"}
          </h1>
          <p className="text-muted-foreground">
            {t("globalMapSubtitle") ||
              "Lihat semua aksi iklim global secara real-time di peta interaktif"}
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex items-center gap-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary font-medium"
          >
            <option value="all">
              {t("filterAll") || "Semua Tipe"} ({climateActions.length})
            </option>
            {actionTypes.map((type) => (
              <option key={type} value={type}>
                {type} (
                {climateActions.filter((a) => a.action_type === type).length})
              </option>
            ))}
          </select>
        </div>

        {/* Map */}
        {loading ? (
          <div className="h-[600px] rounded-lg border border-border bg-muted flex items-center justify-center">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">{t("loadingCommunities")}</p>
            </div>
          </div>
        ) : (
          <div className="h-[600px] rounded-lg overflow-hidden border border-border">
            <MapView
              actions={filteredActions}
              onActionSelect={(action) => {
                setSelectedAction(action);
              }}
            />
          </div>
        )}

        {/* Action Details */}
        {selectedAction && (
          <div className="mt-8 p-6 bg-card border border-border rounded-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {selectedAction.title}
                </h3>
                <p className="text-muted-foreground">
                  {selectedAction.location_name || "Unknown Location"}
                </p>
              </div>
              <button
                onClick={() => setSelectedAction(null)}
                className="px-3 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("actionType") || "Jenis Aksi"}
                </p>
                <p className="font-semibold">{selectedAction.action_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("co2Saved") || "CO2 Tersimpan"}
                </p>
                <p className="font-semibold">
                  {(selectedAction.impact_co2_saved || 0).toLocaleString()} kg
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("createdDate") || "Tanggal Dibuat"}
                </p>
                <p className="font-semibold">
                  {new Date(
                    selectedAction.created_at || Date.now(),
                  ).toLocaleDateString(lang === "en" ? "en-US" : "id-ID")}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
      <ChatBubble />
    </div>
  );
}
