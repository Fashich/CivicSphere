import React from "react";
import BackButton from "@/components/BackButton";
import { useI18n } from "@/lib/i18n";

export default function Blog() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton fallback="/" />
      </div>
      <h1 className="text-3xl font-bold mb-4">{t("blog")}</h1>
      <p className="text-muted-foreground">No blog posts yet.</p>
    </div>
  );
}
