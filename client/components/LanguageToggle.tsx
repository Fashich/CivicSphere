import React from "react";

type Lang = "en" | "id";

export default function LanguageToggle({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setLang("en");
        }}
        className={`px-2 py-1 rounded ${lang === "en" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        aria-label="English"
      >
        EN
      </button>
      <button
        onClick={() => {
          setLang("id");
        }}
        className={`px-2 py-1 rounded ${lang === "id" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        aria-label="Bahasa Indonesia"
      >
        IN
      </button>
    </div>
  );
}
