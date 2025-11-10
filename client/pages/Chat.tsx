import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Send,
  MessageCircle,
  Users,
  Loader,
  User,
  Trash2,
  UserPlus,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import LanguageToggle from "@/components/LanguageToggle";
import ChatBubble from "@/components/ChatBubble";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  room_id?: string;
  sender_id: string;
  recipient_id?: string;
  text: string;
  is_ai?: boolean;
  created_at: string;
  sender_name?: string;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
  friend?: { username: string; id: string };
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState("");
  const [showCommunityChat, setShowCommunityChat] = useState(true);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        navigate("/login");
        return;
      }

      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profile) setCurrentUser(profile);

      // Load friends
      await loadFriends(authUser.id);

      // Load messages
      await loadMessages(authUser.id);

      // Subscribe to messages changes
      const messagesChannel = supabase
        .channel("public:messages")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "messages" },
          async () => {
            await loadMessages(authUser.id);
          },
        )
        .subscribe();

      // Subscribe to friends changes
      const friendsChannel = supabase
        .channel("public:friends")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "friends" },
          async () => {
            await loadFriends(authUser.id);
          },
        )
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(friendsChannel);
      };
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const loadFriends = async (userId: string) => {
    try {
      const { data: friendsData } = await supabase
        .from("friends")
        .select("*, friend:friend_id(username, id)")
        .eq("user_id", userId)
        .eq("status", "accepted");

      if (friendsData) {
        setFriends(friendsData);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*, profiles:sender_id(username)")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: true });

      if (messagesData) {
        setMessages(
          messagesData.map((m: any) => ({
            ...m,
            sender_name: m.profiles?.username || "Unknown",
          })),
        );
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    if (!currentUser) {
      toast({ title: t("authRequired") || "Authentication required" });
      return;
    }

    try {
      const payload: any = {
        sender_id: currentUser.id,
        text: messageInput.trim(),
        created_at: new Date().toISOString(),
      };

      if (selectedFriend) {
        payload.recipient_id = selectedFriend;
      } else {
        payload.room_id = "community-chat";
      }

      const { error } = await supabase.from("messages").insert(payload);
      if (error) throw error;

      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: t("errorTitle") || "Error",
        description: String(error),
      });
    }
  };

  const handleAddFriend = async () => {
    if (!friendUsername.trim() || !currentUser) return;

    try {
      // Find user by username
      const { data: users } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", friendUsername.trim());

      if (!users || users.length === 0) {
        toast({ title: t("userNotFound") || "User not found" });
        return;
      }

      const friendId = users[0].id;

      // Create friend request
      const { error } = await supabase.from("friends").insert({
        user_id: currentUser.id,
        friend_id: friendId,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: t("friendRequestSent") || "Friend request sent",
      });
      setFriendUsername("");
      setShowAddFriend(false);
    } catch (error) {
      console.error("Error adding friend:", error);
      toast({
        title: t("errorTitle") || "Error",
        description: String(error),
      });
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("friend_id", friendId);

      if (error) throw error;

      toast({ title: t("friendRemoved") || "Friend removed" });
    } catch (error) {
      console.error("Error removing friend:", error);
      toast({
        title: t("errorTitle") || "Error",
        description: String(error),
      });
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.friend?.username.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredMessages = selectedFriend
    ? messages.filter(
        (m) =>
          (m.sender_id === currentUser?.id && m.recipient_id === selectedFriend) ||
          (m.sender_id === selectedFriend && m.recipient_id === currentUser?.id),
      )
    : messages.filter((m) => m.room_id === "community-chat");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">{t("loadingCommunities")}</p>
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-120px)] flex gap-6">
        {/* Sidebar - Friends List */}
        <div className="w-64 bg-card border border-border rounded-lg flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("chatFriends") || "Teman"}
            </h2>
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-full px-3 py-2 rounded bg-primary text-primary-foreground text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2 justify-center"
            >
              <UserPlus className="w-4 h-4" />
              {t("addFriend") || "Tambah Teman"}
            </button>
            <div className="mt-3 relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchFriends") || "Cari teman..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded bg-background text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Community Chat */}
          <button
            onClick={() => {
              setSelectedFriend(null);
              setShowCommunityChat(true);
            }}
            className={`p-4 border-b border-border text-left transition-colors ${
              !selectedFriend && showCommunityChat
                ? "bg-primary/10"
                : "hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4" />
              <p className="font-medium">{t("communityChat") || "Chat Komunitas"}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("publicChat") || "Obrolan publik"}
            </p>
          </button>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className={`p-3 border-b border-border transition-colors ${
                    selectedFriend === friend.friend_id
                      ? "bg-primary/10"
                      : "hover:bg-muted cursor-pointer"
                  }`}
                >
                  <button
                    onClick={() => {
                      setSelectedFriend(friend.friend_id);
                      setShowCommunityChat(false);
                    }}
                    className="w-full text-left"
                  >
                    <p className="font-medium text-sm">
                      {friend.friend?.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("tapToChat") || "Ketuk untuk chat"}
                    </p>
                  </button>
                  <button
                    onClick={() => handleRemoveFriend(friend.friend_id)}
                    className="mt-1 w-full px-2 py-1 rounded text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    {t("remove") || "Hapus"}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {searchTerm
                  ? t("noFriendsFound") || "Teman tidak ditemukan"
                  : t("noFriends") || "Belum ada teman"}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-card border border-border rounded-lg flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-border">
            <h2 className="font-bold">
              {selectedFriend
                ? friends.find((f) => f.friend_id === selectedFriend)?.friend
                    ?.username || "Chat"
                : t("communityChat") || "Chat Komunitas"}
            </h2>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUser?.id
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs p-3 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {selectedFriend === null && (
                      <p className="text-xs font-semibold mb-1">
                        {message.sender_name}
                      </p>
                    )}
                    <p className="text-sm break-words">{message.text}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString(
                        lang === "en" ? "en-US" : "id-ID",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-center">
                  {t("noMessages") || "Belum ada pesan"}
                </p>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={t("chatPlaceholder")}
                className="flex-1 px-3 py-2 rounded bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 rounded bg-primary text-primary-foreground hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("addFriend") || "Tambah Teman"}</DialogTitle>
            <DialogDescription>
              {t("enterFriendUsername") ||
                "Masukkan username teman yang ingin Anda tambahkan"}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              {t("username")}
            </label>
            <input
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="john_doe"
              className="w-full px-3 py-2 rounded border bg-card"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddFriend();
              }}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowAddFriend(false)}
              className="px-4 py-2 rounded bg-muted"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleAddFriend}
              className="px-4 py-2 rounded bg-primary text-primary-foreground"
            >
              {t("addFriend") || "Tambah"}
            </button>
          </DialogFooter>
          <DialogClose className="sr-only" />
        </DialogContent>
      </Dialog>

      <ChatBubble />
    </div>
  );
}
