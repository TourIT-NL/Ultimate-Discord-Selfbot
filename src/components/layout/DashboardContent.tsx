import { motion, AnimatePresence } from "framer-motion";
import { MessagesMode } from "../dashboard/modes/MessagesMode";
import { ServersMode } from "../dashboard/modes/ServersMode";
import { IdentityMode } from "../dashboard/modes/IdentityMode";
import { SecurityMode } from "../dashboard/modes/SecurityMode";
import { PrivacyMode } from "../dashboard/modes/PrivacyMode";
import { AccountMode } from "../dashboard/modes/AccountMode";
import { ExportMode } from "../dashboard/modes/ExportMode";
import { Guild, Channel, Relationship } from "../../types/discord";

interface DashboardContentProps {
  mode:
    | "messages"
    | "servers"
    | "identity"
    | "security"
    | "privacy"
    | "account"
    | "export";
  selectedGuilds: Set<string>;
  guilds: Guild[] | null;
  isLoading: boolean;
  isProcessing: boolean;
  timeRange: "24h" | "7d" | "all";
  setTimeRange: (val: "24h" | "7d" | "all") => void;
  simulation: boolean;
  setSimulation: (val: boolean) => void;
  closeEmptyDms: boolean;
  setCloseEmptyDms: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  purgeReactions: boolean;
  setPurgeReactions: (val: boolean) => void;
  onlyAttachments: boolean;
  setOnlyAttachments: (val: boolean) => void;
  channelsByGuild: Map<string, Channel[]>;
  selectedChannels: Set<string>;
  handleToggleChannel: (id: string) => void;
  setSelectedChannels: (val: Set<string>) => void;
  previews: any[];
  confirmText: string;
  setConfirmText: (val: string) => void;
  startAction: () => void;
  selectedGuildsToLeave: Set<string>;
  setSelectedGuildsToLeave: (val: Set<string>) => void;
  handleBuryAuditLog: (id?: string) => void;
  handleWebhookGhosting: (id?: string) => void;
  relationships: Relationship[] | null;
  selectedRelationships: Set<string>;
  setSelectedRelationships: (val: Set<string>) => void;
  authorizedApps: any[];
  fetchSecurityAudit: () => void;
  handleRevokeApp: (id: string) => void;
  handleOpenDiscordUrl: (url: string) => void;
  gdprStatus: any | null;
  fetchPrivacyAudit: () => void;
  handleTriggerHarvest: () => void;
  handleMaxPrivacySanitize: () => void;
  handleProcessGdprData: (data?: string) => void;
  handleSetProxy: (proxy: string | null) => void;
  billingInfo: any | null;
  fetchAccountAudit: () => void;
  handleSetHypesquad: (house: number) => void;
  handleGhostProfile: () => void;
  exportDirection: "sent" | "received" | "both";
  setExportDirection: (val: "sent" | "received" | "both") => void;
  includeAttachmentsInHtml: boolean;
  setIncludeAttachmentsInHtml: (val: boolean) => void;
  handleStartExport: (format: "html" | "raw") => void;
  handleStartGuildArchive: () => void;
}

export const DashboardContent = ({
  mode,
  selectedGuilds,
  guilds,
  isLoading,
  isProcessing,
  timeRange,
  setTimeRange,
  simulation,
  setSimulation,
  closeEmptyDms,
  setCloseEmptyDms,
  searchQuery,
  setSearchQuery,
  purgeReactions,
  setPurgeReactions,
  onlyAttachments,
  setOnlyAttachments,
  channelsByGuild,
  selectedChannels,
  handleToggleChannel,
  setSelectedChannels,
  previews,
  confirmText,
  setConfirmText,
  startAction,
  selectedGuildsToLeave,
  setSelectedGuildsToLeave,
  handleBuryAuditLog,
  handleWebhookGhosting,
  relationships,
  selectedRelationships,
  setSelectedRelationships,
  authorizedApps,
  fetchSecurityAudit,
  handleRevokeApp,
  handleOpenDiscordUrl,
  gdprStatus,
  fetchPrivacyAudit,
  handleTriggerHarvest,
  handleMaxPrivacySanitize,
  handleProcessGdprData,
  handleSetProxy,
  billingInfo,
  fetchAccountAudit,
  handleSetHypesquad,
  handleGhostProfile,
  exportDirection,
  setExportDirection,
  includeAttachmentsInHtml,
  setIncludeAttachmentsInHtml,
  handleStartExport,
  handleStartGuildArchive,
}: DashboardContentProps) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${mode}-${Array.from(selectedGuilds).join("-") || "empty"}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="flex-1 flex flex-col gap-10"
      >
        {mode === "messages" && (
          <MessagesMode
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            simulation={simulation}
            setSimulation={setSimulation}
            closeEmptyDms={closeEmptyDms}
            setCloseEmptyDms={setCloseEmptyDms}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            purgeReactions={purgeReactions}
            setPurgeReactions={setPurgeReactions}
            onlyAttachments={onlyAttachments}
            setOnlyAttachments={setOnlyAttachments}
            guilds={guilds}
            channelsByGuild={channelsByGuild}
            selectedChannels={selectedChannels}
            onToggleChannel={handleToggleChannel}
            onMapAll={() => {
              const all = new Set<string>();
              channelsByGuild.forEach((cs) => cs.forEach((c) => all.add(c.id)));
              setSelectedChannels(all);
            }}
            previews={previews}
            confirmText={confirmText}
            setConfirmText={setConfirmText}
            isProcessing={isProcessing}
            onStartAction={startAction}
          />
        )}
        {mode === "servers" && (
          <ServersMode
            guilds={guilds}
            selectedGuildsToLeave={selectedGuildsToLeave}
            onToggleGuildToLeave={(id) => {
              const next = new Set(selectedGuildsToLeave);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedGuildsToLeave(next);
            }}
            onSelectAllNodes={() =>
              setSelectedGuildsToLeave(new Set(guilds?.map((g) => g.id)))
            }
            confirmText={confirmText}
            setConfirmText={setConfirmText}
            isProcessing={isProcessing}
            onStartAction={startAction}
            selectedGuilds={selectedGuilds}
            channelsByGuild={channelsByGuild}
            selectedChannels={selectedChannels}
            onToggleChannelForAudit={(id) => setSelectedChannels(new Set([id]))}
            onBuryAuditLog={() => handleBuryAuditLog()}
            onWebhookGhosting={() => handleWebhookGhosting()}
            isLoading={isLoading}
          />
        )}
        {mode === "identity" && (
          <IdentityMode
            relationships={relationships}
            selectedRelationships={selectedRelationships}
            onToggleRelationship={(id) => {
              const next = new Set(selectedRelationships);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              setSelectedRelationships(next);
            }}
            onMapAllLinks={() =>
              setSelectedRelationships(new Set(relationships?.map((r) => r.id)))
            }
            confirmText={confirmText}
            setConfirmText={setConfirmText}
            isProcessing={isProcessing}
            onStartAction={startAction}
          />
        )}
        {mode === "security" && (
          <SecurityMode
            apps={authorizedApps || []}
            fetchAudit={fetchSecurityAudit}
            onRevoke={handleRevokeApp}
            onOpenDiscordUrl={handleOpenDiscordUrl}
          />
        )}
        {mode === "privacy" && (
          <PrivacyMode
            status={gdprStatus}
            fetchAudit={fetchPrivacyAudit}
            onTriggerHarvest={handleTriggerHarvest}
            onSanitize={handleMaxPrivacySanitize}
            onOpenDiscordUrl={handleOpenDiscordUrl}
            onProcessGdprData={() => handleProcessGdprData()}
            onSetProxy={handleSetProxy}
          />
        )}
        {mode === "account" && (
          <AccountMode
            info={billingInfo}
            fetchAudit={fetchAccountAudit}
            onOpenDiscordUrl={handleOpenDiscordUrl}
            onSetHypesquad={(id) => handleSetHypesquad(Number(id))}
            onGhostProfile={handleGhostProfile}
          />
        )}
        {mode === "export" && (
          <ExportMode
            guilds={guilds}
            selectedGuilds={selectedGuilds}
            channelsByGuild={channelsByGuild}
            selectedChannels={selectedChannels}
            onToggleChannel={handleToggleChannel}
            exportDirection={exportDirection}
            setExportDirection={setExportDirection}
            includeAttachmentsInHtml={includeAttachmentsInHtml}
            setIncludeAttachmentsInHtml={setIncludeAttachmentsInHtml}
            onStartExport={handleStartExport}
            onStartGuildArchive={handleStartGuildArchive}
            isProcessing={isProcessing}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
