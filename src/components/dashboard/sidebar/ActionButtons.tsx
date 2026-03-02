import { Heart, Terminal, ShieldAlert, Flame, LogOut } from "lucide-react";
import { useAuthStore } from "../../../store/authStore";

interface ActionButtonsProps {
  onOpenDonateLink: () => void;
  onNuclearWipe: () => void;
  onBurnEvidence: () => void;
  onLogout: () => void;
}

export const ActionButtons = ({
  onOpenDonateLink,
  onNuclearWipe,
  onBurnEvidence,
  onLogout,
}: ActionButtonsProps) => {
  const { showDevLog, toggleDevLog } = useAuthStore();

  return (
    <div className="mt-auto space-y-4">
      <button
        onClick={onOpenDonateLink}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-m3-xl bg-m3-tertiaryContainer/20 text-m3-tertiary hover:bg-m3-tertiaryContainer/40 transition-all border border-m3-tertiary/20 font-black uppercase tracking-widest text-[10px] italic"
      >
        <Heart className="w-4 h-4" /> Support Development
      </button>
      <button
        onClick={toggleDevLog}
        className={`w-full flex items-center justify-center gap-3 p-4 rounded-m3-xl transition-all border font-black uppercase tracking-widest text-[10px] italic ${
          showDevLog
            ? "bg-m3-primary/20 text-m3-primary border-m3-primary/40"
            : "bg-white/5 text-m3-onSurfaceVariant border-white/10 hover:bg-white/10"
        }`}
      >
        <Terminal className="w-4 h-4" /> System Protocol Log
      </button>
      <button
        onClick={() => {
          if (
            confirm(
              "INITIATE NUCLEAR OPTION? This will wipe your profile, leave all guilds, and remove all friends.",
            )
          ) {
            onNuclearWipe();
          }
        }}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-m3-xl bg-m3-errorContainer/20 text-m3-error hover:bg-m3-errorContainer/40 transition-all border border-m3-error/40 font-black uppercase tracking-widest text-[10px] italic"
      >
        <ShieldAlert className="w-4 h-4" /> Nuclear Option
      </button>
      <button
        onClick={onBurnEvidence}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-m3-xl bg-m3-errorContainer/40 text-m3-error hover:bg-m3-errorContainer/60 transition-all border border-m3-error/60 font-black uppercase tracking-widest text-[10px] italic shadow-[0_0_20px_rgba(179,38,30,0.2)]"
      >
        <Flame className="w-4 h-4 animate-pulse" /> Burn Evidence
        (Anti-Forensic)
      </button>
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-3 p-4 rounded-m3-xl bg-m3-errorContainer/10 text-m3-error hover:bg-m3-errorContainer/20 transition-all border border-m3-error/20 font-black uppercase tracking-widest text-[10px] italic"
      >
        <LogOut className="w-4 h-4" /> Terminate Session
      </button>
    </div>
  );
};
