import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../../store/authStore";

export const useGeneralOps = (
  handleApiError: (err: any, fallback: string) => void,
  setIsProcessing?: (val: boolean) => void,
  setIsComplete?: (val: boolean) => void,
) => {
  const { setLoading, setError } = useAuthStore();

  const handleOpenDonateLink = async () => {
    try {
      await invoke("open_external_link", {
        url: "https://www.buymeacoffee.com/discordpurge",
      });
    } catch (err: any) {
      handleApiError(err, "Failed to open donate link.");
    }
  };

  const handleOpenDiscordUrl = async (actionType: string) => {
    try {
      await invoke("open_discord_url_for_action", { actionType });
    } catch (err: any) {
      handleApiError(err, "Failed to open Discord gateway.");
    }
  };

  const handleNuclearWipe = async () => {
    if (setIsProcessing) setIsProcessing(true);
    if (setIsComplete) setIsComplete(false);
    try {
      await invoke("nuclear_wipe");
      if (setIsComplete) setIsComplete(true);
      setError("Nuclear protocol complete. Your account is sanitized.");
    } catch (err: any) {
      handleApiError(err, "Nuclear wipe failed.");
    } finally {
      if (setIsProcessing) setIsProcessing(false);
    }
  };

  const handleBurnEvidence = async () => {
    if (
      !confirm(
        "CRITICAL: This will SHRED all local data (tokens, cache, logs) using a multi-pass overwrite. This is irreversible and will defeat forensic recovery. Proceed?",
      )
    )
      return;

    setLoading(true);
    try {
      await invoke("start_burner_protocol");
      useAuthStore.getState().reset();
      window.location.reload(); // Force full app reset
    } catch (err: any) {
      handleApiError(err, "Burner protocol failed.");
    } finally {
      setLoading(false);
    }
  };

  return {
    handleOpenDonateLink,
    handleOpenDiscordUrl,
    handleNuclearWipe,
    handleBurnEvidence,
  };
};
