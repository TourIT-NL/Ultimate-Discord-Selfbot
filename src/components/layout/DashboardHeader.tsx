import {
  Server,
  Shield,
  Fingerprint,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { IconButton } from "../common/M3Components";

interface DashboardHeaderProps {
  mode: string;
  setMode: (mode: any) => void;
  isProcessing: boolean;
  selectedGuildsCount: number;
  currentGuildName?: string;
  onOpenManual: () => void;
}

export const DashboardHeader = ({
  mode,
  setMode,
  isProcessing,
  selectedGuildsCount,
  currentGuildName,
  onOpenManual,
}: DashboardHeaderProps) => {
  const getTitle = () => {
    if (isProcessing) return "Execution In Progress";
    switch (mode) {
      case "identity":
        return "Identity Links";
      case "security":
        return "Security Audit";
      case "privacy":
        return "Privacy Hardening";
      case "account":
        return "Financial Footprint";
      case "export":
        return "Data Extraction";
      default:
        if (selectedGuildsCount === 0) return "Select Sources";
        if (selectedGuildsCount === 1)
          return currentGuildName || "Direct Messages";
        return `${selectedGuildsCount} Sources Selected`;
    }
  };

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-6">
        <div className="p-5 rounded-m3-xl bg-m3-surfaceVariant shadow-lg border border-m3-outlineVariant/30 text-m3-onSurfaceVariant group relative overflow-hidden">
          <div className="absolute inset-0 bg-m3-primary/5 animate-pulse" />
          <Server className="w-8 h-8 relative z-10" />
        </div>
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">
            {isProcessing ? (
              <span className="text-m3-error animate-pulse">{getTitle()}</span>
            ) : (
              getTitle()
            )}
          </h2>
          <div className="flex items-center gap-3 mt-4 bg-m3-primary/10 w-fit px-4 py-1.5 rounded-full border border-m3-primary/20 shadow-inner">
            <div
              className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(208,188,255,0.8)] ${
                isProcessing ? "bg-m3-error" : "bg-m3-primary"
              }`}
            />
            <p
              className={`text-[10px] font-black uppercase tracking-[0.4em] italic leading-none ${
                isProcessing ? "text-m3-error" : "text-m3-primary"
              }`}
            >
              {isProcessing ? "Protocol Active" : "Node Connection Established"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex bg-m3-surfaceVariant rounded-m3-full p-1.5 border border-m3-outlineVariant shadow-inner">
        <button
          disabled={isProcessing}
          onClick={() => setMode("messages")}
          className={`px-8 py-2.5 rounded-m3-full text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === "messages"
              ? "bg-m3-primary text-m3-onPrimary"
              : "text-m3-onSurfaceVariant"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Messages
        </button>
        {selectedGuildsCount > 0 && (
          <button
            disabled={isProcessing}
            onClick={() => setMode("servers")}
            className={`px-8 py-2.5 rounded-m3-full text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === "servers"
                ? "bg-m3-primary text-m3-onPrimary"
                : "text-m3-onSurfaceVariant"
            } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Servers
          </button>
        )}
        <button
          disabled={isProcessing}
          onClick={() => setMode("identity")}
          className={`px-8 py-2.5 rounded-m3-full text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === "identity"
              ? "bg-m3-primary text-m3-onPrimary"
              : "text-m3-onSurfaceVariant"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Friends
        </button>
        <button
          disabled={isProcessing}
          onClick={() => setMode("export")}
          className={`px-8 py-2.5 rounded-m3-full text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === "export"
              ? "bg-m3-primary text-m3-onPrimary"
              : "text-m3-onSurfaceVariant"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Export
        </button>
        <div className="w-px bg-white/10 mx-2" />
        <button
          disabled={isProcessing}
          onClick={() => setMode("security")}
          className={`p-2.5 rounded-m3-full transition-all ${
            mode === "security"
              ? "bg-m3-tertiary text-m3-onTertiary"
              : "text-m3-onSurfaceVariant hover:bg-white/5"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Shield className="w-4 h-4" />
        </button>
        <button
          disabled={isProcessing}
          onClick={() => setMode("privacy")}
          className={`p-2.5 rounded-m3-full transition-all ${
            mode === "privacy"
              ? "bg-m3-tertiary text-m3-onTertiary"
              : "text-m3-onSurfaceVariant hover:bg-white/5"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Fingerprint className="w-4 h-4" />
        </button>
        <button
          disabled={isProcessing}
          onClick={() => setMode("account")}
          className={`p-2.5 rounded-m3-full transition-all ${
            mode === "account"
              ? "bg-m3-tertiary text-m3-onTertiary"
              : "text-m3-onSurfaceVariant hover:bg-white/5"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <CreditCard className="w-4 h-4" />
        </button>
        <div className="w-px bg-white/10 mx-2" />
        <IconButton
          icon={HelpCircle}
          onClick={onOpenManual}
          className="!text-m3-onSurfaceVariant hover:!text-m3-primary transition-colors"
        />
      </div>
    </div>
  );
};
