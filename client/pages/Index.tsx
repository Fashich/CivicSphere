import React, { useState, useEffect } from "react";
import { Earth3D } from "@/components/Earth3D";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import ChatBubble from "@/components/ChatBubble";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Globe, Users, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

export default function Index() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [actions, setActions] = useState<any[]>([]);
  const { lang, setLang, t } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let channel: any = null;

    const loadAndSubscribe = async () => {
      try {
        const { data: actionsData } = await supabase
          .from("climate_actions")
          .select("*")
          .eq("status", "active");
        setActions(actionsData || []);

        channel = supabase
          .channel("public:climate_actions")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "climate_actions" },
            (payload: any) => {
              const evt = (
                payload.event ||
                payload.eventType ||
                ""
              ).toUpperCase();
              if (evt === "INSERT" && payload.new)
                setActions((prev) => [
                  payload.new,
                  ...prev.filter((a: any) => a.id !== payload.new.id),
                ]);
              else if (evt === "UPDATE" && payload.new)
                setActions((prev) =>
                  prev.map((p) => (p.id === payload.new.id ? payload.new : p)),
                );
              else if (evt === "DELETE" && payload.old)
                setActions((prev) =>
                  prev.filter((p) => p.id !== payload.old.id),
                );
            },
          )
          .subscribe();
      } catch (error) {
        console.error("Error loading actions:", error);
      }
    };

    loadAndSubscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b border-border"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2Fedee6dbdb7b64837ae037addcd2dafdc%2F1c33dd3c179341e49fcbc665d4045f39?format=webp&width=80"
                alt="CivicSphere"
                className="w-8 h-8 rounded-md object-cover"
              />
              <span className="text-xl font-bold text-primary">
                CivicSphere
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageToggle lang={lang} setLang={setLang} />
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg text-primary hover:bg-muted transition-colors"
            >
              {t("signIn")}
            </Link>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium hover:shadow-lg transition-all"
            >
              {t("getStarted")}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Earth */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <Earth3D />

        {/* Overlay content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-lg mb-4">
              CivicSphere
            </h1>
            <p className="text-lg sm:text-xl text-white/80 drop-shadow-md max-w-2xl mx-auto">
              {t("heroSubtitle")}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pointer-events-auto mt-8">
            <Link
              to="/signup"
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold hover:shadow-xl transition-all flex items-center gap-2 text-center justify-center"
            >
              {t("getStarted")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/features"
              className="px-8 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold hover:bg-white/20 transition-all flex items-center justify-center"
            >
              {t("learnMore")}
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="relative z-20 bg-background py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-primary">
            {t("featuresTitle")}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t("featureVisualizationTitle")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("featureVisualizationDesc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t("featureCommunityTitle")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("featureCommunityDesc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t("featureAITitle")}</h3>
              <p className="text-muted-foreground text-sm">
                {t("featureAIDesc")}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2">
                {t("featureTransparencyTitle")}
              </h3>
              <p className="text-muted-foreground text-sm">
                {t("featureTransparencyDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/30 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-primary">
            {t("howItWorksTitle")}
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: t("step1Title"),
                description: t("step1Desc"),
              },
              {
                step: 2,
                title: t("step2Title"),
                description: t("step2Desc"),
              },
              {
                step: 3,
                title: t("step3Title"),
                description: t("step3Desc"),
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground items-center justify-center font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-secondary py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            {t("ctaTitle")}
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            {t("ctaSubtitle")}
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 rounded-lg bg-primary-foreground text-primary font-bold hover:shadow-xl transition-all"
          >
            {t("ctaButton")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div>
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fedee6dbdb7b64837ae037addcd2dafdc%2F1c33dd3c179341e49fcbc665d4045f39?format=webp&width=80"
                    alt="CivicSphere"
                    className="w-8 h-8 rounded-md object-cover inline-block mr-2"
                  />
                  <span className="font-bold text-primary">CivicSphere</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("heroSubtitle")}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t("footerProduct")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-primary transition-colors"
                  >
                    {t("aboutUs")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/features"
                    className="hover:text-primary transition-colors"
                  >
                    {t("featuresLink")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t("communityTitle")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/join"
                    className="hover:text-primary transition-colors"
                  >
                    {t("join")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blog"
                    className="hover:text-primary transition-colors"
                  >
                    {t("blog")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t("legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-primary transition-colors"
                  >
                    {t("privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-primary transition-colors"
                  >
                    {t("terms")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 CivicSphere. {t("footerCopyright")}</p>
          </div>
        </div>
      </footer>
      <ChatBubble />

      {/* CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}
