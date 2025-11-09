import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { generateText } from "@/lib/ai";
import AvatarCropper from "@/components/AvatarCropper";
import BackButton from "@/components/BackButton";
import ChatBubble from "@/components/ChatBubble";

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return (
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "mailto:" ||
      url.protocol === "tel:"
    );
  } catch (e) {
    return false;
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>({});
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      let authUser: any = null;
      try {
        const {
          data: { user: user },
        } = await supabase.auth.getUser();
        authUser = user;

        if (!isMounted) return;

        if (!authUser) {
          navigate("/login");
          return;
        }

        // Fetch profile with simple error handling
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (!isMounted) return;

        // Handle case where profile doesn't exist yet (new user)
        if (error && error.code === "PGRST116") {
          // No rows returned - create default profile
          setProfile({
            id: authUser.id,
            username: authUser.email?.split("@")[0] || "user",
            language: lang,
          });
        } else if (error) {
          // Log error details for debugging
          console.error(
            "Error loading profile from Supabase:",
            error.message,
            error.code,
          );
          setProfile({
            id: authUser.id,
            username: authUser.email?.split("@")[0] || "user",
            language: lang,
          });
        } else if (profileData) {
          setProfile(profileData);
          // Set language from profile if available
          if (profileData.language && profileData.language !== lang) {
            setLang(profileData.language as "en" | "id");
          }
        } else {
          // No error, but no data either - new user
          setProfile({
            id: authUser.id,
            username: authUser.email?.split("@")[0] || "user",
            language: lang,
          });
        }
      } catch (error: any) {
        if (!isMounted) return;
        console.error("Error in profile load:", error);
        // Set default profile so page doesn't break
        if (authUser) {
          setProfile({
            id: authUser.id,
            username: authUser.email?.split("@")[0] || "user",
            language: lang,
          });
        } else {
          setProfile({
            id: "unknown",
            username: "user",
            language: lang,
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [navigate, lang, setLang]);

  const handleChange = (key: string, value: any) => {
    setProfile((p: any) => ({ ...p, [key]: value }));
  };

  const handleAvatarFile = (file: File) => {
    if (
      file &&
      (file.type.startsWith("image/") || file.type.startsWith("video/"))
    ) {
      setSelectedFileForCrop(file);
      setShowCropper(true);
    } else {
      toast({
        title: "Format tidak valid",
        description:
          "Pilih file gambar atau video (PNG, JPG, GIF, WebP, MP4, WebM).",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleAvatarFile(files[0]);
    }
  };

  const [showCropper, setShowCropper] = useState(false);
  const [selectedFileForCrop, setSelectedFileForCrop] = useState<File | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const handleUploadAvatar = async (file: File | null) => {
    if (!file || !profile?.id) return;
    try {
      // Resize image to max 512px
      const imgBitmap = await createImageBitmap(file);
      const maxSize = 512;
      const ratio = Math.min(
        maxSize / imgBitmap.width,
        maxSize / imgBitmap.height,
        1,
      );
      const width = Math.round(imgBitmap.width * ratio);
      const height = Math.round(imgBitmap.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");
      ctx.drawImage(imgBitmap, 0, 0, width, height);

      const blob: Blob | null = await new Promise((res) =>
        canvas.toBlob(res, "image/jpeg", 0.85),
      );
      if (!blob) throw new Error("Failed to create resized image");

      const fileExt = "jpg";
      const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;
      const uploadFile = new File([blob], `avatar.${fileExt}`, {
        type: "image/jpeg",
      });

      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, uploadFile, { upsert: true });
      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast({
          title: t("uploadFailed"),
          description: String(uploadError.message || uploadError),
        });
        return;
      }

      // Get public URL
      const { data: publicData } = await supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      if (publicData?.publicUrl) {
        setProfile((p: any) => ({ ...p, avatar_url: publicData.publicUrl }));
        toast({
          title: lang === "en" ? "Avatar uploaded" : "Avatar diunggah",
          description: t("uploadSuccess"),
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Upload error",
        description: String(err),
      });
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Validate URLs
    if (!isValidUrl(profile.portfolio_url || "")) {
      toast({
        title: t("invalidPortfolioURL"),
        description:
          lang === "en"
            ? "Check URL format (must be http/https)."
            : "Periksa format URL (harus http/https).",
      });
      return;
    }
    if (!isValidUrl(profile.linkedin_url || "")) {
      toast({
        title: t("invalidLinkedinURL"),
        description:
          lang === "en"
            ? "Check URL format (must be http/https)."
            : "Periksa format URL (harus http/https).",
      });
      return;
    }
    if (!isValidUrl(profile.instagram_url || "")) {
      toast({
        title: t("invalidInstagramURL"),
        description:
          lang === "en"
            ? "Check URL format (must be http/https)."
            : "Periksa format URL (harus http/https).",
      });
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        username: profile.username,
        bio: profile.bio,
        portfolio_url: profile.portfolio_url,
        linkedin_url: profile.linkedin_url,
        instagram_url: profile.instagram_url,
        whatsapp: profile.whatsapp,
        custom_links: profile.custom_links || [],
        avatar_url: profile.avatar_url || null,
      };

      const { error } = await (supabase.from("profiles") as any).upsert(
        { id: profile.id, ...dataToSave, language: lang },
        { returning: "representation" },
      );
      if (error) throw error;
      toast({
        title: t("profileSaved"),
        description: t("profileSavedDesc"),
      });
    } catch (err) {
      console.error(err);
      toast({
        title: lang === "en" ? "Failed to save" : "Gagal menyimpan",
        description: String(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSuggestBio = async () => {
    if (!profile) return;
    setSuggesting(true);
    try {
      const prompt = `Buatkan bio profesional singkat (2-3 kalimat) untuk seorang pengguna bernama ${profile.username} yang bekerja pada komunitas aksi iklim. Sertakan portfolio: ${profile.portfolio_url || "tidak ada"} dan LinkedIn: ${profile.linkedin_url || "tidak ada"}. Gunakan bahasa Indonesia.`;
      const suggested = await generateText(prompt);
      if (suggested) {
        setProfile((p: any) => ({ ...p, bio: suggested }));
        toast({
          title: "Saran bio dibuat",
          description: "Bio telah diisi otomatis. Ubah jika perlu.",
        });
      } else {
        toast({
          title: "AI tidak tersedia",
          description:
            "Fitur AI sedang tidak tersedia. Silakan isi bio secara manual.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: t("errorTitle"),
        description: "Terjadi kesalahan saat membuat saran bio.",
      });
    } finally {
      setSuggesting(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t("myProfile")}...
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton />
          <img
            src="https://cdn.builder.io/api/v1/image/assets%2Fedee6dbdb7b64837ae037addcd2dafdc%2F1c33dd3c179341e49fcbc665d4045f39?format=webp&width=80"
            alt="CivicSphere"
            className="w-8 h-8 rounded-md object-cover"
          />
          <h1 className="text-2xl font-bold">{t("myProfile")}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle lang={lang} setLang={setLang} />
          <ThemeToggle />
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">{t("username")}</label>
          <input
            value={profile.username || ""}
            onChange={(e) => handleChange("username", e.target.value)}
            className="w-full px-3 py-2 rounded border bg-card"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">{t("avatar")}</label>
          <div className="flex items-center gap-4">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 px-6 py-4 rounded border-2 border-dashed cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-muted-foreground/30 bg-muted/20"
              }`}
            >
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarFile(f);
                }}
                className="hidden"
                id="avatar-input"
              />
              <label
                htmlFor="avatar-input"
                className="cursor-pointer block text-center"
              >
                <div className="text-sm font-medium">{t("dragVideoHere")}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {t("supportedVideoFormats")}
                </div>
              </label>
            </div>
          </div>

          {showCropper && selectedFileForCrop && (
            <AvatarCropper
              file={selectedFileForCrop}
              onCancel={() => {
                setShowCropper(false);
                setSelectedFileForCrop(null);
              }}
              onCrop={async (blob) => {
                const croppedFile = new File([blob], `avatar.jpg`, {
                  type: "image/jpeg",
                });
                setShowCropper(false);
                setSelectedFileForCrop(null);
                await handleUploadAvatar(croppedFile);
              }}
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium">{t("bio")}</label>
          <textarea
            value={profile.bio || ""}
            onChange={(e) => handleChange("bio", e.target.value)}
            className="w-full px-3 py-2 rounded border bg-card"
          />
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={handleSuggestBio}
              disabled={suggesting}
              className="px-3 py-1 rounded bg-primary text-primary-foreground"
            >
              {suggesting ? "Generating..." : t("fillWithAI")}
            </button>
            <button
              type="button"
              onClick={() => setProfile((p: any) => ({ ...p, bio: "" }))}
              className="px-3 py-1 rounded bg-muted"
            >
              {t("clear")}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">
            {t("portfolioURL")}
          </label>
          <input
            value={profile.portfolio_url || ""}
            onChange={(e) => handleChange("portfolio_url", e.target.value)}
            className="w-full px-3 py-2 rounded border bg-card"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            {t("linkedinURL")}
          </label>
          <input
            value={profile.linkedin_url || ""}
            onChange={(e) => handleChange("linkedin_url", e.target.value)}
            className="w-full px-3 py-2 rounded border bg-card"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            {t("instagramURL")}
          </label>
          <input
            value={profile.instagram_url || ""}
            onChange={(e) => handleChange("instagram_url", e.target.value)}
            className="w-full px-3 py-2 rounded border bg-card"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">{t("whatsapp")}</label>
          <input
            value={profile.whatsapp || ""}
            onChange={(e) => handleChange("whatsapp", e.target.value)}
            className="w-full px-3 py-2 rounded border bg-card"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              {t("customLinks")}
            </label>
            <button
              type="button"
              onClick={() => {
                const customLinks = profile.custom_links || [];
                handleChange("custom_links", [
                  ...customLinks,
                  { label: "", url: "" },
                ]);
              }}
              className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80"
            >
              {t("addLink")}
            </button>
          </div>
          <div className="space-y-2">
            {(profile.custom_links || []).map(
              (link: { label: string; url: string }, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <input
                    placeholder={t("label") + " (contoh: Portfolio)"}
                    value={link.label || ""}
                    onChange={(e) => {
                      const customLinks = [...(profile.custom_links || [])];
                      customLinks[idx].label = e.target.value;
                      handleChange("custom_links", customLinks);
                    }}
                    className="flex-1 px-3 py-2 rounded border bg-card text-sm"
                  />
                  <input
                    placeholder={t("url")}
                    value={link.url || ""}
                    onChange={(e) => {
                      const customLinks = [...(profile.custom_links || [])];
                      customLinks[idx].url = e.target.value;
                      handleChange("custom_links", customLinks);
                    }}
                    className="flex-1 px-3 py-2 rounded border bg-card text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const customLinks = profile.custom_links || [];
                      handleChange(
                        "custom_links",
                        customLinks.filter((_: any, i: number) => i !== idx),
                      );
                    }}
                    className="px-2 py-1 rounded bg-muted text-destructive hover:bg-destructive/10"
                  >
                    ✕
                  </button>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : t("saveProfile")}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded bg-muted hover:bg-muted/80"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
      <ChatBubble />
    </div>
  );
}
