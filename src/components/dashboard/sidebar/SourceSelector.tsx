import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Guild } from "../../../types/discord";

interface SourceSelectorProps {
  guilds: Guild[] | null;
  selectedGuilds: Set<string>;
  onToggleGuildSelection: (guild: Guild | null) => void;
}

export const SourceSelector = ({
  guilds,
  selectedGuilds,
  onToggleGuildSelection,
}: SourceSelectorProps) => (
  <div className="m3-card !p-2 max-h-[calc(100vh-520px)] overflow-y-auto custom-scrollbar flex flex-col gap-1.5 shadow-inner bg-black/20 border-m3-outlineVariant/20">
    <button
      onClick={() => onToggleGuildSelection(null)}
      className={`flex items-center gap-4 p-4 rounded-m3-xl transition-all text-left relative group ${
        selectedGuilds.has("dms")
          ? "bg-m3-primaryContainer text-m3-onPrimaryContainer shadow-lg"
          : "hover:bg-m3-surfaceVariant/40 text-m3-onSurfaceVariant"
      }`}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-m3-md bg-m3-tertiaryContainer text-m3-onTertiaryContainer flex items-center justify-center font-black text-sm border border-white/5 shadow-md">
          <MessageSquare className="w-5 h-5" />
        </div>
        {selectedGuilds.has("dms") && (
          <motion.div
            layoutId="pulse-active"
            className="absolute -inset-1 rounded-m3-lg border border-m3-primary animate-pulse"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-black truncate block uppercase italic tracking-tight">
          Direct Messages
        </span>
        <p className="text-[9px] opacity-50 font-bold uppercase tracking-widest mt-0.5">
          Private Buffers
        </p>
      </div>
    </button>
    <div className="h-px bg-white/5 my-2 mx-4" />
    {guilds?.map((g) => (
      <button
        key={g.id}
        onClick={() => onToggleGuildSelection(g)}
        className={`flex items-center gap-4 p-4 rounded-m3-xl transition-all text-left relative group ${
          selectedGuilds.has(g.id)
            ? "bg-m3-primaryContainer text-m3-onPrimaryContainer shadow-lg"
            : "hover:bg-m3-surfaceVariant/40 text-m3-onSurfaceVariant"
        }`}
      >
        <div className="relative">
          {g.icon ? (
            <img
              src={`https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`}
              className="w-10 h-10 rounded-m3-md shadow-md border border-white/5"
            />
          ) : (
            <div className="w-10 h-10 rounded-m3-md bg-m3-secondaryContainer text-m3-onSecondaryContainer flex items-center justify-center font-black text-sm border border-white/5 uppercase">
              {g.name[0]}
            </div>
          )}
          {selectedGuilds.has(g.id) && (
            <motion.div
              layoutId="pulse-active"
              className="absolute -inset-1 rounded-m3-lg border border-m3-primary animate-pulse"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-black truncate block uppercase italic tracking-tight">
            {g.name}
          </span>
          <p className="text-[9px] opacity-50 font-bold uppercase tracking-widest mt-0.5">
            Stream Ready
          </p>
        </div>
      </button>
    ))}
  </div>
);
