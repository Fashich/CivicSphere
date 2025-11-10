import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description?: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let channel: any = null;

    const load = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        const list = (data || []) as NotificationItem[];
        setItems(list);
        setUnread(list.filter((n) => !n.is_read).length);

        channel = supabase
          .channel(`public:notifications:${user.id}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
            async () => {
              const { data: fresh } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(10);
              const list2 = (fresh || []) as NotificationItem[];
              setItems(list2);
              setUnread(list2.filter((n) => !n.is_read).length);
            },
          )
          .subscribe();
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const markAllRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (e) {
      // ignore
    }
  };

  const markOneRead = async (id: string) => {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnread((u) => Math.max(0, u - 1));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="relative" data-notifications>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-20">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <p className="text-sm font-semibold">Notifikasi</p>
            <button
              onClick={markAllRead}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
              disabled={unread === 0}
            >
              <CheckCheck className="w-3 h-3" /> Tandai semua dibaca
            </button>
          </div>
          <div className="max-h-80 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted-foreground">Memuat...</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Tidak ada notifikasi</div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li key={n.id} className={`p-3 ${!n.is_read ? "bg-primary/5" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.description && (
                          <p className="text-xs text-muted-foreground mt-1">{n.description}</p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {new Date(n.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => markOneRead(n.id)}
                          className="text-xs px-2 py-1 rounded bg-primary text-primary-foreground"
                        >
                          Tandai dibaca
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
