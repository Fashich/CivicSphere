import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Globe, Zap, Plus, Calendar, Target } from "lucide-react";
import BackButton from "@/components/BackButton";
import LanguageToggle from "@/components/LanguageToggle";
import NotificationBell from "@/components/NotificationBell";
import ChatBubble from "@/components/ChatBubble";
import { useI18n } from "@/lib/i18n";
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

interface Project {
  id: string;
  community_id: string;
  title: string;
  description: string;
  status: "planning" | "active" | "completed";
  start_date: string;
  end_date?: string;
  target_co2_reduction: number;
  actual_co2_reduction: number;
  creator_id: string;
  community_name?: string;
  created_at: string;
}

export default function Projects() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "planning" | "active" | "completed"
  >("all");
  const [sortBy, setSortBy] = useState<"recent" | "impact" | "progress">(
    "recent",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCommunityId, setNewCommunityId] = useState<string | null>(null);
  const [userCommunities, setUserCommunities] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login");
        return;
      }

      await loadProjects();
      await loadUserCommunities(authUser.id);

      // Subscribe to communities changes for real-time updates
      const communitiesChannel = supabase
        .channel("public:communities")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "communities" },
          async () => {
            await loadUserCommunities(authUser.id);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(communitiesChannel);
      };
    };

    checkAuth();
  }, [navigate]);

  const loadUserCommunities = async (userId: string) => {
    try {
      // Load all communities (we'll filter on the client side)
      const { data: allComms } = await supabase
        .from("communities")
        .select("*")
        .order("created_at", { ascending: false });

      if (allComms) {
        setUserCommunities(allComms);
      }
    } catch (e) {
      console.error("Failed loading user communities", e);
    }
  };

  const loadProjects = async () => {
    try {
      const { data: projectsData } = await supabase
        .from("projects")
        .select(
          `
          *,
          communities:community_id(name)
        `,
        )
        .order("created_at", { ascending: false });

      if (projectsData) {
        setProjects(
          projectsData.map((p: any) => ({
            ...p,
            community_name: p.communities?.name || t("unknown"),
          })),
        );
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects
    .filter((p) => (filterStatus === "all" ? true : p.status === filterStatus))
    .sort((a, b) => {
      if (sortBy === "impact") {
        return b.actual_co2_reduction - a.actual_co2_reduction;
      }
      if (sortBy === "progress") {
        const progressA =
          a.target_co2_reduction > 0
            ? a.actual_co2_reduction / a.target_co2_reduction
            : 0;
        const progressB =
          b.target_co2_reduction > 0
            ? b.actual_co2_reduction / b.target_co2_reduction
            : 0;
        return progressB - progressA;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  const getStatusColor = (status: "planning" | "active" | "completed") => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700";
      case "completed":
        return "bg-blue-500/10 text-blue-700";
      case "planning":
        return "bg-yellow-500/10 text-yellow-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t("filterActive");
      case "completed":
        return t("filterCompleted");
      case "planning":
        return t("filterPlanning");
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 animate-pulse mb-4"></div>
          <p className="text-muted-foreground">{t("loadingProjects")}</p>
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
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              {t("newProject")}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{t("projectsTitle")}</h1>
          <p className="text-muted-foreground">{t("projectsSubtitle")}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            {(["all", "planning", "active", "completed"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {status === "all"
                    ? t("filterAll")
                    : status === "planning"
                      ? t("filterPlanning")
                      : status === "active"
                        ? t("filterActive")
                        : t("filterCompleted")}
                  {status === "all"
                    ? ` (${projects.length})`
                    : ` (${projects.filter((p) => p.status === status).length})`}
                </button>
              ),
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 rounded-lg bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary font-medium ml-auto"
          >
            <option value="recent">{t("sortRecent")}</option>
            <option value="impact">{t("sortImpact")}</option>
            <option value="progress">{t("sortProgress")}</option>
          </select>
        </div>

        {/* Projects List */}
        <div className="grid md:grid-cols-2 gap-6">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => {
              const progress =
                project.target_co2_reduction > 0
                  ? Math.round(
                      (project.actual_co2_reduction /
                        project.target_co2_reduction) *
                        100,
                    )
                  : 0;

              return (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-lg hover:border-primary transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold group-hover:text-primary transition-colors mb-1">
                        {project.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {project.community_name}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {t("targetCO2")}
                      </div>
                      <div className="font-bold">
                        {project.target_co2_reduction.toLocaleString()} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {t("achieved")}
                      </div>
                      <div className="font-bold">
                        {project.actual_co2_reduction.toLocaleString()} kg
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("progressLabel")}
                      </span>
                      <span className="text-xs font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Dates */}
                  {project.start_date && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.start_date).toLocaleDateString(
                        lang === "en" ? "en-US" : "id-ID",
                      )}
                      {project.end_date &&
                        ` - ${new Date(project.end_date).toLocaleDateString(
                          lang === "en" ? "en-US" : "id-ID",
                        )}`}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">{t("noProjectsTitle")}</h3>
              <p className="text-muted-foreground">{t("noProjectsDesc")}</p>
            </div>
          )}
        </div>
        {/* Create Project Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("createProjectTitle")}</DialogTitle>
              <DialogDescription>{t("createProjectDesc")}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-sm font-medium">
                  {t("title")}
                </label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
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
                <label className="block text-sm font-medium">
                  {t("community")}
                </label>
                <select
                  value={newCommunityId || ""}
                  onChange={(e) => setNewCommunityId(e.target.value || null)}
                  className="w-full px-3 py-2 rounded border bg-card"
                >
                  <option value="">{t("selectCommunityPlaceholder")}</option>
                  {userCommunities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
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
                    if (!newTitle.trim()) {
                      toast({ title: t("titleRequired") });
                      return;
                    }
                    if (!newCommunityId) {
                      toast({ title: t("selectCommunity") });
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
                      const { data: newProject, error } = await supabase
                        .from("projects")
                        .insert({
                          title: newTitle.trim(),
                          description: newDescription.trim(),
                          community_id: newCommunityId,
                          creator_id: authUser.id,
                        })
                        .select("*")
                        .single();
                      if (error) throw error;
                      setProjects((prev) => [newProject, ...prev]);
                      setShowCreate(false);
                      setNewTitle("");
                      setNewDescription("");
                      setNewCommunityId(null);
                      toast({ title: t("projectCreated") });
                    } catch (err) {
                      console.error(err);
                      toast({
                        title: t("projectCreateFailed"),
                        description: String(err),
                      });
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="px-4 py-2 rounded bg-primary text-primary-foreground"
                >
                  {creating ? t("creating") : t("createProjectTitle")}
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
