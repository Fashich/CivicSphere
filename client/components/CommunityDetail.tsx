import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Plus,
  Trash2,
  MessageCircle,
  Settings,
  Crown,
  User,
  Mail,
  MapPin,
  Calendar,
} from "lucide-react";

interface Member {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: "admin" | "member" | "moderator";
  contribution_points: number;
  joined_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  status: "planning" | "active" | "completed";
  start_date: string;
  end_date?: string;
  target_co2_reduction: number;
  actual_co2_reduction: number;
  creator_id: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_username?: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  avatar_url?: string;
  banner_url?: string;
  location_name?: string;
  member_count: number;
  created_at: string;
  visibility?: "public" | "request" | "closed";
}

interface CommunityDetailProps {
  communityId: string;
  onClose?: () => void;
  isOwner?: boolean;
}

type TabType = "overview" | "members" | "projects" | "messages" | "settings";

export const CommunityDetail: React.FC<CommunityDetailProps> = ({
  communityId,
  onClose,
  isOwner = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMember, setIsMember] = useState<boolean>(false);

  useEffect(() => {
    const loadCommunityData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        setCurrentUser(authUser);

        // Load community
        const { data: communityData } = await supabase
          .from("communities")
          .select("*")
          .eq("id", communityId)
          .single();
        if (communityData) setCommunity(communityData);

        // Load members
        const { data: membersData } = await supabase
          .from("community_members")
          .select(
            `
            id,
            role,
            contribution_points,
            joined_at,
            profiles:user_id(id, username, email, avatar_url)
          `,
          )
          .eq("community_id", communityId);

        if (membersData) {
          const mapped = membersData.map((m: any) => ({
            id: m.profiles.id,
            username: m.profiles.username,
            email: m.profiles.email,
            avatar_url: m.profiles.avatar_url,
            role: m.role,
            contribution_points: m.contribution_points,
            joined_at: m.joined_at,
          }));
          setMembers(mapped);
          if (authUser) setIsMember(mapped.some((m) => m.id === authUser.id));
        }

        // Load projects
        const { data: projectsData } = await supabase
          .from("projects")
          .select("*")
          .eq("community_id", communityId);
        if (projectsData) setProjects(projectsData);

        // Load recent messages
        const { data: messagesData } = await supabase
          .from("messages")
          .select(
            `
            id,
            sender_id,
            content,
            created_at,
            profiles:sender_id(username)
          `,
          )
          .eq("community_id", communityId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (messagesData) {
          setMessages(
            messagesData
              .map((m: any) => ({
                id: m.id,
                sender_id: m.sender_id,
                content: m.content,
                created_at: m.created_at,
                sender_username: m.profiles?.username || "Unknown",
              }))
              .reverse(),
          );
        }
      } catch (error) {
        console.error("Error loading community data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCommunityData();
  }, [communityId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      const { data: messageData } = await supabase
        .from("messages")
        .insert([
          {
            community_id: communityId,
            sender_id: currentUser.id,
            content: newMessage,
          },
        ])
        .select();

      if (messageData) {
        setMessages([
          ...messages,
          {
            id: messageData[0].id,
            sender_id: currentUser.id,
            content: newMessage,
            created_at: messageData[0].created_at,
            sender_username: currentUser.email?.split("@")[0] || "You",
          },
        ]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Yakin ingin menghapus anggota ini?")) return;

    try {
      await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityId)
        .eq("user_id", memberId);

      setMembers(members.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 animate-pulse mb-4"></div>
          <p className="text-muted-foreground">Memuat komunitas...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Komunitas tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Banner */}
      {community.banner_url && (
        <div
          className="h-48 bg-gradient-to-b from-primary to-primary/50 relative overflow-hidden"
          style={{
            backgroundImage: `url(${community.banner_url})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
      )}

      {/* Community Info Card */}
      <div className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {community.avatar_url && (
              <img
                src={community.avatar_url}
                alt={community.name}
                className="w-16 h-16 rounded-lg object-cover border-2 border-primary"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{community.name}</h1>
              <p className="text-muted-foreground text-sm">
                {community.member_count} anggota
                {community.location_name && ` • ${community.location_name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isMember && currentUser && (
              community.visibility === "closed" ? (
                <button className="px-4 py-2 rounded-lg bg-muted cursor-not-allowed" disabled>
                  Tertutup
                </button>
              ) : community.visibility === "request" ? (
                <button
                  onClick={async () => {
                    try {
                      await supabase.from("community_join_requests").insert({
                        community_id: community.id,
                        user_id: currentUser.id,
                      });
                      alert("Permohonan bergabung dikirim");
                    } catch (e) {
                      alert(String(e));
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  Ajukan Bergabung
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      await supabase.from("community_members").insert({
                        community_id: community.id,
                        user_id: currentUser.id,
                        role: "member",
                      });
                      await supabase
                        .from("communities")
                        .update({ member_count: (community.member_count || 0) + 1 })
                        .eq("id", community.id);
                      alert("Bergabung ke komunitas");
                      setIsMember(true);
                    } catch (e) {
                      alert(String(e));
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground"
                >
                  Bergabung
                </button>
              )
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex gap-6">
          {(
            [
              { id: "overview", label: "Gambaran Umum", icon: "📊" },
              { id: "members", label: "Anggota", icon: "👥" },
              { id: "projects", label: "Proyek", icon: "📋" },
              { id: "messages", label: "Chat", icon: "💬" },
              ...(isOwner
                ? [{ id: "settings", label: "Pengaturan", icon: "⚙️" }]
                : []),
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-4 px-2 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Tentang Komunitas</h2>
              <p className="text-muted-foreground">{community.description}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Total Anggota
                </div>
                <div className="text-3xl font-bold">
                  {community.member_count}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Proyek Aktif
                </div>
                <div className="text-3xl font-bold">
                  {projects.filter((p) => p.status === "active").length}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">Dibuat</div>
                <div className="text-sm font-medium">
                  {new Date(community.created_at).toLocaleDateString("id-ID")}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Anggota ({members.length})</h2>
              {isOwner && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4" />
                  Tambah Anggota
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    {member.avatar_url && (
                      <img
                        src={member.avatar_url}
                        alt={member.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{member.username}</span>
                        {member.role === "admin" && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {member.role} • {member.contribution_points} poin
                      </div>
                    </div>
                  </div>
                  {isOwner && member.role !== "admin" && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Proyek ({projects.length})</h2>
              {isOwner && (
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4" />
                  Proyek Baru
                </button>
              )}
            </div>
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-lg p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{project.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === "active"
                          ? "bg-green-500/10 text-green-700"
                          : project.status === "completed"
                            ? "bg-blue-500/10 text-blue-700"
                            : "bg-yellow-500/10 text-yellow-700"
                      }`}
                    >
                      {project.status === "active"
                        ? "Aktif"
                        : project.status === "completed"
                          ? "Selesai"
                          : "Perencanaan"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">
                        Target CO2
                      </div>
                      <div className="font-bold">
                        {project.target_co2_reduction.toLocaleString()} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Tercapai</div>
                      <div className="font-bold">
                        {project.actual_co2_reduction.toLocaleString()} kg
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Progress</div>
                      <div className="font-bold">
                        {Math.round(
                          (project.actual_co2_reduction /
                            project.target_co2_reduction) *
                            100,
                        )}
                        %
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          (project.actual_co2_reduction /
                            project.target_co2_reduction) *
                            100,
                          100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Obrolan Komunitas</h2>
            <div className="bg-card border border-border rounded-lg p-6 h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm">
                          {message.sender_username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Tulis pesan..."
                  className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all"
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {isOwner && activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Pengaturan Komunitas</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nama</label>
                  <input
                    type="text"
                    defaultValue={community.name}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Deskripsi</label>
                  <textarea
                    defaultValue={community.description}
                    rows={4}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  ></textarea>
                </div>
                <button className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:shadow-lg transition-all">
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
