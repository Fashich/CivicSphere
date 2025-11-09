import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { generateText } from "@/lib/ai";
import { useI18n } from "@/lib/i18n";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Message = {
  id: string;
  room_id?: string | null;
  sender_id?: string | null;
  recipient_id?: string | null;
  text: string;
  is_ai?: boolean;
  created_at?: string;
};

export default function ChatModal({
  open,
  onClose,
  recipientId,
}: {
  open: boolean;
  onClose: () => void;
  recipientId?: string | null; // if provided, direct chat to user; otherwise CivicAI
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!mounted) return;
        setUserId(user?.id ?? null);
      } catch (e) {
        console.error("Failed to get user for chat:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const uid = user?.id;
        // Fetch messages: either civicai room or direct messages where user is sender or recipient
        if (recipientId) {
          const { data } = await supabase
            .from("messages")
            .select("*")
            .or(
              `sender_id.eq.${uid},recipient_id.eq.${uid},sender_id.eq.${recipientId},recipient_id.eq.${recipientId}`,
            )
            .order("created_at", { ascending: true });
          if (mounted) setMessages((data as any) || []);
        } else {
          const { data } = await supabase
            .from("messages")
            .select("*")
            .or(`room_id.eq.civicai,sender_id.eq.${uid},recipient_id.eq.${uid}`)
            .order("created_at", { ascending: true });
          if (mounted) setMessages((data as any) || []);
        }

        // subscribe to new messages
        try {
          const channel = supabase
            .channel("public:messages")
            .on(
              "postgres_changes",
              { event: "INSERT", schema: "public", table: "messages" },
              (payload) => {
                const newMsg = payload.new as Message;
                // Only add relevant messages
                if (recipientId) {
                  if (
                    newMsg.sender_id === uid ||
                    newMsg.recipient_id === uid ||
                    newMsg.sender_id === recipientId ||
                    newMsg.recipient_id === recipientId
                  ) {
                    setMessages((m) => [...m, newMsg]);
                  }
                } else {
                  if (
                    newMsg.room_id === "civicai" ||
                    newMsg.sender_id === uid ||
                    newMsg.recipient_id === uid
                  ) {
                    setMessages((m) => [...m, newMsg]);
                  }
                }
              },
            )
            .subscribe();

          return () => {
            try {
              supabase.removeChannel(channel);
            } catch (e) {}
          };
        } catch (e) {
          // supabase.channel not available - ignore subscription
          console.warn("Realtime subscription not available:", e);
        }
      } catch (err) {
        console.error("Failed loading chat messages:", err);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [open, recipientId]);

  useEffect(() => {
    // scroll to bottom when messages change
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const navigate = useNavigate();

  function serializeError(e: any) {
    if (!e) return "Unknown error";
    if (typeof e === "string") return e;
    if (e instanceof Error) return e.message + (e.stack ? "\n" + e.stack : "");
    try {
      return JSON.stringify(e, Object.getOwnPropertyNames(e), 2);
    } catch (_) {
      return String(e);
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = user?.id ?? null;

      // require login to send messages (except AI system messages)
      if (!uid) {
        toast({ title: "Please sign in to send messages" });
        setLoading(false);
        // navigate to login after short delay
        setTimeout(() => navigate("/login"), 500);
        return;
      }

      const payload: any = {
        text: input.trim(),
        created_at: new Date().toISOString(),
        sender_id: uid,
      };
      if (recipientId) {
        payload.recipient_id = recipientId;
      } else {
        payload.room_id = "civicai";
      }

      let res: any;
      try {
        // Insert without .select() to avoid supabase client parsing body twice
        res = await supabase.from("messages").insert(payload);
      } catch (dbErr) {
        const ser = serializeError(dbErr);
        console.error("Failed to send message (db, thrown):", ser, dbErr);
        toast({ title: "Failed to send message", description: ser });
        setLoading(false);
        return;
      }

      const { data, error } = res as any;
      if (error) {
        const ser = serializeError(error);
        console.error("Failed to send message (db):", ser, error);
        toast({ title: "Failed to send message", description: ser });
        setLoading(false);
        return;
      }

      setInput("");

      // If civicai room, call generateText and insert AI response
      if (!recipientId) {
        try {
          const prompt = `User: ${payload.text}\nAssistant:`;
          const ai = await generateText(prompt);
          if (ai) {
            const aiPayload: any = {
              text: ai,
              is_ai: true,
              room_id: "civicai",
              created_at: new Date().toISOString(),
            };
            // insert ai message (no .select())
            const aiRes = await supabase.from("messages").insert(aiPayload);
            if (aiRes.error) {
              const serAi = serializeError(aiRes.error);
              console.error("Failed to insert AI message:", serAi, aiRes.error);
              toast({ title: "AI save failed", description: serAi });
            }
          }
        } catch (aiErr) {
          const ser = serializeError(aiErr);
          console.error("AI generation failed:", ser, aiErr);
          toast({ title: "AI generation failed", description: ser });
        }
      }
    } catch (err) {
      const ser = serializeError(err);
      console.error("Failed to send message:", ser, err);
      toast({ title: "Failed to send message", description: ser });
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:w-96 max-h-[80vh] bg-card border border-border rounded-lg m-4 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="font-bold">CivicAI{recipientId ? ` (DM)` : ""}</div>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded hover:bg-muted"
          >
            Close
          </button>
        </div>
        <div ref={listRef} className="p-4 overflow-auto flex-1 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-2 rounded-lg max-w-[80%] ${m.is_ai ? "bg-primary/10 ml-0" : m.sender_id === userId ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}
            >
              <div className="text-sm">{m.text}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(m.created_at || Date.now()).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-border">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              className="flex-1 px-3 py-2 rounded border bg-background"
              placeholder={t("chatPlaceholder") || "Type a message..."}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="px-3 py-2 rounded bg-primary text-primary-foreground"
            >
              {loading ? "..." : t("send") || "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
