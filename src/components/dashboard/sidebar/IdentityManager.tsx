import { Plus } from "lucide-react";
import { DiscordIdentity, DiscordUser } from "../../../types/discord";

interface IdentityManagerProps {
  user: DiscordUser | null;
  identities: DiscordIdentity[];
  onSwitchIdentity: (id: string) => void;
  onNewIdentity: () => void;
}

export const IdentityManager = ({
  user,
  identities,
  onSwitchIdentity,
  onNewIdentity,
}: IdentityManagerProps) => (
  <div className="flex flex-col gap-2 p-2 bg-black/20 rounded-m3-xl border border-m3-outlineVariant/20">
    {identities.map((id) => (
      <button
        key={id.id}
        onClick={() => onSwitchIdentity(id.id)}
        className={`flex items-center gap-3 p-3 rounded-m3-lg transition-all text-left ${
          user?.id === id.id
            ? "bg-m3-primaryContainer text-m3-onPrimaryContainer"
            : "hover:bg-m3-surfaceVariant/40 text-m3-onSurfaceVariant"
        }`}
      >
        <div className="w-8 h-8 rounded-full bg-m3-secondaryContainer flex items-center justify-center font-black text-xs uppercase">
          {id.username[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-black truncate uppercase italic">
            {id.username}
          </p>
          <p className="text-[8px] opacity-50 uppercase tracking-widest">
            {id.is_oauth ? "OFFICIAL" : "BYPASS"}
          </p>
        </div>
        {user?.id === id.id && (
          <div className="w-1.5 h-1.5 rounded-full bg-m3-primary animate-pulse" />
        )}
      </button>
    ))}
    <button
      onClick={onNewIdentity}
      className="flex items-center gap-3 p-3 rounded-m3-lg hover:bg-m3-surfaceVariant/40 text-m3-onSurfaceVariant border border-dashed border-m3-outlineVariant/40"
    >
      <Plus className="w-4 h-4" />
      <span className="text-[10px] font-black uppercase tracking-widest">
        New Protocol
      </span>
    </button>
  </div>
);
