import { SectionLabel } from "../common/M3Components";
import { useAuthStore } from "../../store/authStore";
import { useDiscordAuth } from "../../hooks/useDiscordAuth";
import { useDiscordOperations } from "../../hooks/useDiscordOperations";
import { ProtocolModes } from "./sidebar/ProtocolModes";
import { IdentityManager } from "./sidebar/IdentityManager";
import { SourceSelector } from "./sidebar/SourceSelector";
import { ActionButtons } from "./sidebar/ActionButtons";
import { Users, Server } from "lucide-react";

export const Sidebar = () => {
  const { user, guilds } = useAuthStore();
  const {
    identities,
    handleSwitchIdentity,
    setView,
    handleLogout,
    handleApiError,
  } = useDiscordAuth();
  const {
    mode,
    setMode,
    isProcessing,
    selectedGuilds,
    handleToggleGuildSelection,
    handleStealthWipe,
    handleNitroWipe,
    handleNuclearWipe,
    handleBurnEvidence,
    handleOpenDonateLink,
  } = useDiscordOperations(handleApiError);

  return (
    <aside className="w-80 flex flex-col gap-8">
      <div className="flex flex-col gap-4 flex-1">
        <SectionLabel>
          <Users className="w-3.5 h-3.5" /> Protocol Modes
        </SectionLabel>
        <ProtocolModes
          mode={mode}
          setMode={setMode}
          isProcessing={isProcessing}
        />

        <SectionLabel>
          <Users className="w-3.5 h-3.5" /> Identities
        </SectionLabel>
        <IdentityManager
          user={user}
          identities={identities}
          onSwitchIdentity={handleSwitchIdentity}
          onNewIdentity={() => setView("auth")}
        />

        <div className="flex items-center justify-between px-2">
          <SectionLabel>
            <Server className="w-3.5 h-3.5" /> Source Handshakes
          </SectionLabel>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() =>
                guilds?.forEach(
                  (g) =>
                    !selectedGuilds.has(g.id) && handleToggleGuildSelection(g),
                )
              }
              className="text-[9px] font-black text-m3-primary uppercase hover:underline"
            >
              All
            </button>
            <span className="text-white/10 text-[9px]">|</span>
            <button
              onClick={() => {
                selectedGuilds.forEach((id) => {
                  if (id === "dms") handleToggleGuildSelection(null);
                  else {
                    const g = guilds?.find((guild) => guild.id === id);
                    if (g) handleToggleGuildSelection(g);
                  }
                });
              }}
              className="text-[9px] font-black text-m3-outline uppercase hover:underline"
            >
              Clear
            </button>
          </div>
        </div>
        <SourceSelector
          guilds={guilds}
          selectedGuilds={selectedGuilds}
          onToggleGuildSelection={handleToggleGuildSelection}
        />
      </div>

      <ActionButtons
        onOpenDonateLink={handleOpenDonateLink}
        onNuclearWipe={handleNuclearWipe}
        onBurnEvidence={handleBurnEvidence}
        onLogout={handleLogout}
      />
    </aside>
  );
};
