import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../store/authStore";
import { DiscordStatus, DiscordIdentity } from "../types/discord";

export const useDiscordPresence = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const [identities, setIdentities] = useState<DiscordIdentity[]>([]);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus | null>(
    null,
  );

  const checkStatus = useCallback(async () => {
    try {
      const status = await invoke<DiscordStatus>("check_discord_status");
      setDiscordStatus(status);
      useAuthStore.getState().resetRetry();
    } catch (err) {
      const state = useAuthStore.getState();
      if (state.retryCount < 5) {
        state.incrementRetry();
        const backoff = Math.min(1000 * Math.pow(2, state.retryCount), 10000);
        console.warn(
          `[Status] Check failed. Retrying in ${backoff}ms... (${state.retryCount}/5)`,
        );
        setTimeout(checkStatus, backoff);
      } else {
        console.error(
          "[Status] Maximum retries reached. Discord detection offline.",
        );
        handleApiError(err, "Discord link status unavailable.");
      }
    }
  }, [handleApiError]);

  const fetchIdentities = useCallback(async () => {
    try {
      setIdentities(await invoke("list_identities"));
    } catch (err) {
      console.error("Failed to fetch identities:", err);
    }
  }, []);

  const handleSwitchIdentity = async (id: string) => {
    useAuthStore.getState().setLoading(true);
    try {
      await invoke("switch_identity", { id });
    } catch (err: any) {
      handleApiError(err, "Switch failed.");
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  return {
    identities,
    discordStatus,
    checkStatus,
    fetchIdentities,
    handleSwitchIdentity,
  };
};
