import React from "react";
import BackButton from "@/components/BackButton";
import { useI18n } from "@/lib/i18n";

export default function Features() {
  const { t } = useI18n();
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <BackButton fallback="/" />
      </div>
      <h1 className="text-3xl font-bold mb-4">{t("featuresTitle")}</h1>
      <p className="text-muted-foreground mb-6">{t("featuresLink")}</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="p-4 bg-card rounded">
          <h3 className="font-bold">{t("featureVisualizationTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("featureVisualizationDesc")}
          </p>
        </div>
        <div className="p-4 bg-card rounded">
          <h3 className="font-bold">{t("featureCommunityTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("featureCommunityDesc")}
          </p>
        </div>
        <div className="p-4 bg-card rounded">
          <h3 className="font-bold">{t("featureAITitle")}</h3>
          <p className="text-sm text-muted-foreground">{t("featureAIDesc")}</p>
        </div>
        <div className="p-4 bg-card rounded">
          <h3 className="font-bold">{t("featureTransparencyTitle")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("featureTransparencyDesc")}
          </p>
        </div>
      </div>
    </div>
  );
}
