import React from "react";
import BackButton from "@/components/BackButton";
import { useI18n } from "@/lib/i18n";
import { Link } from "react-router-dom";

export default function Join() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <BackButton fallback="/" />
      </div>
      <h1 className="text-3xl font-bold mb-4">{t("join")}</h1>
      <p className="text-muted-foreground mb-6">
        {t("join")} {t("featuresTitle")}
      </p>
      <Link
        to="/signup"
        className="px-6 py-3 bg-primary text-primary-foreground rounded"
      >
        {t("getStarted")}
      </Link>
    </div>
  );
}
