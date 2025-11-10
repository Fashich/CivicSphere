import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Globe, Users, Plus, Search } from "lucide-react";
import BackButton from "@/components/BackButton";
import LanguageToggle from "@/components/LanguageToggle";
import ChatBubble from "@/components/ChatBubble";
import { useI18n } from "@/lib/i18n";
import { MapView } from "@/components/MapView";
import NotificationBell from "@/components/NotificationBell";
import { CommunityDetail } from "@/components/CommunityDetail";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  latitude?: number;
  longitude?: number;
  location_name?: string;
  member_count: number;
  created_at: string;
}

interface ClimateAction {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  action_type: string;
  impact_co2_saved?: number;
  location_name?: string;
  status?: string;
}

export default function Communities() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [climateActions, setClimateActions] = useState<ClimateAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(
    null,
  );
  const [view, setView] = useState<"list" | "map" | "detail">("list");
  const [sortBy, setSortBy] = useState<"recent" | "members" | "name">("recent");
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "request" | "closed">(
    "public",
  );

  useEffect(() => {
    let communitiesChannel: any = null;
    let actionsChannel: any = null;

    const checkAndSubscribe = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login");
        return;
      }

      await loadData();

      // Subscribe to communities changes
      communitiesChannel = supabase
        .channel("public:communities")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "communities" },
          (payload: any) => {
            // payload typing from Supabase runtime may vary between SDK versions.
            // Normalize event name defensively.
            const evt = (
              (payload && (payload.event || payload.eventType)) ||
              ""
            ).toUpperCase();
            const newItem = payload?.new as Community | undefined;
            const oldItem = payload?.old as Partial<Community> | undefined;

            if (evt === "INSERT" && newItem) {
              setCommunities((prev) => [
                newItem,
                ...prev.filter((c) => c.id !== newItem.id),
              ]);
            } else if (evt === "UPDATE" && newItem) {
              setCommunities((prev) =>
                prev.map((c) => (c.id === newItem.id ? newItem : c)),
              );
            } else if (evt === "DELETE" && oldItem?.id) {
              setCommunities((prev) => prev.filter((c) => c.id !== oldItem.id));
            }
          },
        )
        .subscribe();

      // Subscribe to climate_actions changes
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
            const newItem = payload?.new as ClimateAction | undefined;
            const oldItem = payload?.old as Partial<ClimateAction> | undefined;

            if (evt === "INSERT" && newItem) {
              if (
                newItem.status === "active" ||
                (newItem as any).status === undefined
              ) {
                setClimateActions((prev) => [
                  newItem,
                  ...prev.filter((a) => a.id !== newItem.id),
                ]);
              }
            } else if (evt === "UPDATE" && newItem) {
              setClimateActions((prev) => {
                if (
                  (newItem as any).status &&
                  (newItem as any).status !== "active"
                ) {
                  return prev.filter((a) => a.id !== newItem.id);
                }
                const exists = prev.some((a) => a.id === newItem.id);
                if (exists)
                  return prev.map((a) => (a.id === newItem.id ? newItem : a));
                return [newItem, ...prev];
              });
            } else if (evt === "DELETE" && oldItem?.id) {
              setClimateActions((prev) =>
                prev.filter((a) => a.id !== oldItem.id),
              );
            }
          },
        )
        .subscribe();

      setLoading(false);
    };

    checkAndSubscribe();

    return () => {
      if (communitiesChannel) supabase.removeChannel(communitiesChannel);
      if (actionsChannel) supabase.removeChannel(actionsChannel);
    };
  }, [navigate]);

  const loadData = async () => {
    try {
      // Load communities
      const { data: communitiesData } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });

      if (communitiesData) {
        setCommunities(communitiesData);
      }

      // Load climate actions for map
      const { data: actionsData } = await supabase
        .from("climate_actions")
        .select("*")
        .eq("status", "active");

      if (actionsData) {
        setClimateActions(actionsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const filteredCommunities = communities
    .filter(
      (c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "members") return b.member_count - a.member_count;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 animate-pulse mb-4"></div>
          <p className="text-muted-foreground">{t("loadingCommunities")}</p>
        </div>
      </div>
    );
  }

  if (view === "detail" && selectedCommunity) {
    return (
      <CommunityDetail
        communityId={selectedCommunity}
        onClose={() => {
          setView("list");
          setSelectedCommunity(null);
          loadData();
        }}
      />
    );
  }

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
            <button
              onClick={() => setView(view === "map" ? "list" : "map")}
              className="px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium text-sm"
            >
              {view === "map" ? t("listView") : t("mapView")}
            </button>
            <button
              onClick={() => setView(view === "map" ? "list" : "map")}
              className="hidden"
            />
            <button
              onClick={() => navigate("/requests")}
              className="px-4 py-2 rounded-lg hover:bg-muted transition-colors font-medium text-sm"
            >
              Kelola Permohonan
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              {t("newCommunity")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{t("communitiesTitle")}</h1>

          {view === "map" ? (
            <>
              <p className="text-muted-foreground mb-6">
                {t("communitiesSubtitle")}
              </p>
              <div className="h-[600px] rounded-lg overflow-hidden border border-border">
                <MapView
                  actions={climateActions}
                  onActionSelect={(action) => {
                    console.log("Selected action:", action);
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground mb-6">
                {t("communitiesSubtitle")}
              </p>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={t("searchCommunitiesPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                >
                  <option value="recent">{t("sortRecent")}</option>
                  <option value="members">{t("sortMembers")}</option>
                  <option value="name">{t("sortName")}</option>
                </select>
              </div>

              {/* Communities Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunities.length > 0 ? (
                  filteredCommunities.map((community) => (
                    <div
                      key={community.id}
                      onClick={() => {
                        setSelectedCommunity(community.id);
                        setView("detail");
                      }}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary transition-all cursor-pointer group"
                    >
                      {community.avatar_url && (
                        <img
                          src={community.avatar_url}
                          alt={community.name}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">
                          {community.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {community.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>
                              {community.member_count} {t("members")}
                            </span>
                          </div>
                          {community.location_name && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {community.location_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">
                      {t("noCommunitiesTitle")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("noCommunitiesDesc")}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {/* Create Community Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("createCommunityTitle")}</DialogTitle>
              <DialogDescription>{t("createCommunityDesc")}</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">{t("name")}</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded border bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">
                  {t("description")}
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded border bg-card"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Visibilitas</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-3 py-2 rounded border bg-card"
                >
                  <option value="public">Terbuka</option>
                  <option value="request">Butuh Permohonan</option>
                  <option value="closed">Tutup</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 rounded bg-muted"
                >
                  {t("cancel")}
                </button>
                <button
                  disabled={creating}
                  onClick={async () => {
                    if (!newName.trim()) {
                      toast({ title: t("nameRequired") });
                      return;
                    }
                    setCreating(true);
                    try {
                      const {
                        data: { user: authUser },
                      } = await supabase.auth.getUser();
                      if (!authUser) {
                        toast({ title: t("authRequired") });
                        setCreating(false);
                        return;
                      }
                      const { data: newCommunity, error } = await supabase
                        .from("communities")
                        .insert({
                          name: newName.trim(),
                          description: newDescription.trim(),
                          creator_id: authUser.id,
                          member_count: 1,
                          visibility:
                            visibility === "request"
                              ? "request"
                              : visibility === "closed"
                                ? "closed"
                                : "public",
                        })
                        .select("*")
                        .single();
                      if (error) throw error;
                      await supabase.from("community_members").insert({
                        community_id: newCommunity.id,
                        user_id: authUser.id,
                        role: "leader",
                      });
                      setCommunities((prev) => [newCommunity, ...prev]);
                      setShowCreate(false);
                      setNewName("");
                      setNewDescription("");
                      toast({ title: t("communityCreated") });
                    } catch (err) {
                      console.error(err);
                      toast({
                        title: t("communityCreateFailed"),
                        description: String(err),
                      });
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="px-4 py-2 rounded bg-primary text-primary-foreground"
                >
                  {creating ? t("creating") : t("createCommunity")}
                </button>
              </div>
            </DialogFooter>
            <DialogClose className="sr-only" />
          </DialogContent>
        </Dialog>
      </main>
      <ChatBubble />
    </div>
  );
}
