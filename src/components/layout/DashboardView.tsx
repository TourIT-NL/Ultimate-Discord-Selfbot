import { useEffect } from "react";
import { Sidebar } from "../dashboard/Sidebar";
import { useAuthStore } from "../../store/authStore";
import { useDiscordAuth } from "../../hooks/useDiscordAuth";
import { useDiscordOperations } from "../../hooks/useDiscordOperations";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardContent } from "./DashboardContent";

export const DashboardView = () => {
  const { guilds, isLoading } = useAuthStore();
  const { setView, handleApiError } = useDiscordAuth();
  const {
    mode,
    setMode,
    selectedGuilds,
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
    isProcessing,
    startAction,
    selectedGuildsToLeave,
    setSelectedGuildsToLeave,
    handleBuryAuditLog,
    handleWebhookGhosting,
    handleOpenDiscordUrl,
    handleTriggerHarvest,
    handleMaxPrivacySanitize,
    handleRevokeApp,
    fetchSecurityAudit,
    fetchPrivacyAudit,
    fetchAccountAudit,
    authorizedApps,
    gdprStatus,
    billingInfo,
    relationships,
    selectedRelationships,
    setSelectedRelationships,
    fetchRelationships,
    exportDirection,
    setExportDirection,
    includeAttachmentsInHtml,
    setIncludeAttachmentsInHtml,
    handleStartExport,
    handleStartGuildArchive,
    handleSetHypesquad,
    handleGhostProfile,
    handleProcessGdprData,
    handleSetProxy,
  } = useDiscordOperations(handleApiError);

  useEffect(() => {
    if (mode === "identity") {
      fetchRelationships();
    }
  }, [mode, fetchRelationships]);

  const currentGuildName = guilds?.find(
    (g) => g.id === Array.from(selectedGuilds)[0],
  )?.name;

  return (
    <div className="w-full h-full flex gap-10 p-4">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 gap-10">
        <DashboardHeader
          mode={mode}
          setMode={setMode}
          isProcessing={isProcessing}
          selectedGuildsCount={selectedGuilds.size}
          currentGuildName={currentGuildName}
          onOpenManual={() => setView("manual")}
        />
        <DashboardContent
          mode={mode}
          selectedGuilds={selectedGuilds}
          guilds={guilds}
          isLoading={isLoading}
          isProcessing={isProcessing}
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
          channelsByGuild={channelsByGuild}
          selectedChannels={selectedChannels}
          handleToggleChannel={handleToggleChannel}
          setSelectedChannels={setSelectedChannels}
          previews={previews}
          confirmText={confirmText}
          setConfirmText={setConfirmText}
          startAction={startAction}
          selectedGuildsToLeave={selectedGuildsToLeave}
          setSelectedGuildsToLeave={setSelectedGuildsToLeave}
          handleBuryAuditLog={handleBuryAuditLog}
          handleWebhookGhosting={handleWebhookGhosting}
          relationships={relationships}
          selectedRelationships={selectedRelationships}
          setSelectedRelationships={setSelectedRelationships}
          authorizedApps={authorizedApps}
          fetchSecurityAudit={fetchSecurityAudit}
          handleRevokeApp={handleRevokeApp}
          handleOpenDiscordUrl={handleOpenDiscordUrl}
          gdprStatus={gdprStatus}
          fetchPrivacyAudit={fetchPrivacyAudit}
          handleTriggerHarvest={handleTriggerHarvest}
          handleMaxPrivacySanitize={handleMaxPrivacySanitize}
          handleProcessGdprData={handleProcessGdprData}
          handleSetProxy={handleSetProxy}
          billingInfo={billingInfo}
          fetchAccountAudit={fetchAccountAudit}
          handleSetHypesquad={handleSetHypesquad}
          handleGhostProfile={handleGhostProfile}
          exportDirection={exportDirection}
          setExportDirection={setExportDirection}
          includeAttachmentsInHtml={includeAttachmentsInHtml}
          setIncludeAttachmentsInHtml={setIncludeAttachmentsInHtml}
          handleStartExport={handleStartExport}
          handleStartGuildArchive={handleStartGuildArchive}
        />
      </main>
    </div>
  );
};
