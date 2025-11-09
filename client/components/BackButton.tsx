import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function BackButton({
  fallback = "/",
  label,
  className = "",
}: {
  fallback?: string;
  label?: string;
  className?: string;
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    try {
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(fallback);
      }
    } catch (_) {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors ${className}`}
      aria-label={label || "Kembali"}
    >
      <ArrowLeft className="w-5 h-5" />
      {label && <span className="text-sm font-medium">{label}</span>}
    </button>
  );
}
