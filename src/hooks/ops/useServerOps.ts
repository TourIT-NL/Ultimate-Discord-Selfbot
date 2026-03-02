import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../../store/authStore";
import { useSelectionState } from "../useSelectionState";

export const useServerOps = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setError, setLoading } = useAuthStore();
  const { selectedGuildsToLeave, selectedGuilds, selectedChannels } =
    useSelectionState();

  const startServerLeave = async () => {
    try {
      await invoke("bulk_leave_guilds", {
        guildIds: Array.from(selectedGuildsToLeave),
      });
    } catch (err) {
      handleApiError(err, "Server leave protocol failed.");
      throw err;
    }
  };

  const handleBuryAuditLog = async () => {
    if (selectedGuilds.size === 0 || selectedChannels.size === 0) {
      setError(
        "Please select at least one guild and one channel for audit log burial.",
      );
      return;
    }
    const guildId = Array.from(selectedGuilds)[0];
    if (guildId === "dms") {
      setError("Audit log burial cannot be performed on DMs.");
      return;
    }

    setLoading(true);
    try {
      const channelId = Array.from(selectedChannels)[0];
      await invoke("bury_audit_log", { guildId, channelId });
      setError(
        "Audit log burial initiated. Check Discord's audit log for details.",
      );
    } catch (err: any) {
      handleApiError(err, "Failed to bury audit log.");
    } finally {
      setLoading(false);
    }
  };

  const handleWebhookGhosting = async () => {
    if (selectedGuilds.size === 0) {
      setError("Please select a guild for webhook ghosting.");
      return;
    }
    const guildId = Array.from(selectedGuilds)[0];
    if (guildId === "dms") {
      setError("Webhook ghosting cannot be performed on DMs.");
      return;
    }

    setLoading(true);
    try {
      await invoke("webhook_ghosting", { guildId });
      setError("Webhook Ghosting initiated.");
    } catch (err: any) {
      handleApiError(err, "Failed to perform webhook ghosting.");
    } finally {
      setLoading(false);
    }
  };

  return {
    startServerLeave,
    handleBuryAuditLog,
    handleWebhookGhosting,
  };
};
