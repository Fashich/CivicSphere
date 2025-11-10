import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

export default function Support() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      const lastError = sessionStorage.getItem("lastErrorMessage");
      const lastStack = sessionStorage.getItem("lastErrorStack");
      const lastUrl = sessionStorage.getItem("lastErrorUrl");
      const ua = navigator.userAgent;
      const auto = `Isu otomatis terdeteksi\nURL: ${lastUrl || window.location.href}\nUser-Agent: ${ua}\nPesan: ${lastError || "-"}\nStack: ${lastStack || "-"}`;
      setMessage(auto);
    } catch (_) {}
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("support_tickets").insert({
        user_id: user?.id || null,
        message,
        url: window.location.href,
        user_agent: navigator.userAgent,
        error_stack: sessionStorage.getItem("lastErrorStack"),
        status: "open",
      });
      alert("Laporan support tersimpan. Tim akan meninjau secepatnya.");
      navigate(-1);
    } catch (e) {
      alert(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const emailHref = () => {
    const subject = encodeURIComponent("CivicSphere Support");
    const body = encodeURIComponent(message);
    return `mailto:thalassaaddict@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Hubungi Support</h1>
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded hover:bg-muted"
          >
            Tutup
          </button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <p className="text-muted-foreground text-sm">
          Sistem otomatis mengisi keluhan sesuai kendala secara realtime, Anda
          dapat mengedit sebelum kirim.
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={12}
          className="w-full px-3 py-2 rounded border bg-card"
        />
        <div className="flex gap-3 flex-wrap">
          <button
            disabled={submitting}
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : "Kirim & Simpan ke Database"}
          </button>
          <a
            href={emailHref()}
            className="px-4 py-2 rounded bg-muted hover:bg-muted/80"
          >
            Kirim via Email
          </a>
          <a
            href="https://www.linkedin.com/in/ahmadfashich/"
            target="_blank"
            className="px-4 py-2 rounded bg-muted hover:bg-muted/80"
            rel="noreferrer"
          >
            Hubungi via LinkedIn
          </a>
        </div>
      </main>
    </div>
  );
}
