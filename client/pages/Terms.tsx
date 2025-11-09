import React from "react";
import BackButton from "@/components/BackButton";
import { useI18n } from "@/lib/i18n";

export default function Terms() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton fallback="/" />
      </div>
      <h1 className="text-3xl font-bold mb-4">{t("terms")}</h1>
      <p className="text-muted-foreground">
        These are the terms of service placeholder. Replace with legal text.
      </p>
    </div>
  );
}
