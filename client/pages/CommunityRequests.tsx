import { supabase } from "@/lib/supabase";

interface Request {
  id: string;
  community_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  profiles?: { username: string };
  communities?: { name: string };
}

export default function CommunityRequests() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("community_join_requests")
        .select("*, profiles:user_id(username), communities:community_id(name)")
        .order("created_at", { ascending: false });
      setRequests((data || []) as any);
      setLoading(false);
    };
    load();
  }, []);

  const act = async (id: string, approve: boolean) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    if (approve) {
      await supabase.from("community_members").insert({
        community_id: req.community_id,
        user_id: req.user_id,
        role: "member",
      });
    }
    await supabase
      .from("community_join_requests")
      .update({ status: approve ? "approved" : "rejected" })
      .eq("id", id);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: approve ? "approved" : "rejected" } : r,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-4">
        Permintaan Bergabung Komunitas
      </h1>
      {loading ? (
        <p>Memuat...</p>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada permintaan</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="p-4 bg-card border border-border rounded-lg flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium">
                  {r.profiles?.username} → {r.communities?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} • {r.status}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(r.id, true)}
                  className="px-3 py-1 rounded bg-green-600 text-white"
                  disabled={r.status !== "pending"}
                >
                  Terima
                </button>
                <button
                  onClick={() => act(r.id, false)}
                  className="px-3 py-1 rounded bg-red-600 text-white"
                  disabled={r.status !== "pending"}
                >
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
