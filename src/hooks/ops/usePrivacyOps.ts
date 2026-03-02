import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useAuthStore } from "../../store/authStore";

export const usePrivacyOps = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setLoading, setError } = useAuthStore();
  const [gdprStatus, setGdprStatus] = useState<any>(null);

  const fetchPrivacyAudit = useCallback(async () => {
    setLoading(true);
    try {
      setGdprStatus(await invoke("get_harvest_status"));
    } catch (err: any) {
      handleApiError(err, "Failed to fetch GDPR status.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, handleApiError]);

  const handleTriggerHarvest = async () => {
    setLoading(true);
    try {
      await invoke("trigger_data_harvest");
      setError("GDPR Data Harvest protocol triggered.");
      fetchPrivacyAudit();
    } catch (err: any) {
      handleApiError(err, "Failed to trigger harvest.");
    } finally {
      setLoading(false);
    }
  };

  const handleMaxPrivacySanitize = async () => {
    setLoading(true);
    try {
      await invoke("set_max_privacy_settings");
      setError("Maximum privacy hardening applied.");
    } catch (err: any) {
      handleApiError(err, "Failed to apply privacy hardening.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessGdprData = async () => {
    const selected = await open({
      multiple: false,
      filters: [{ name: "Discord Data Package", extensions: ["zip"] }],
    });
    if (!selected) return;

    setLoading(true);
    try {
      const discovery: any = await invoke("process_gdpr_data", {
        zipPath: selected,
      });
      setError(
        `GDPR Discovery complete: Found ${discovery.channel_ids.length} channels and ${discovery.guild_ids.length} guilds.`,
      );
    } catch (err: any) {
      handleApiError(err, "Failed to process GDPR data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetProxy = async (proxyUrl: string | null) => {
    setLoading(true);
    try {
      await invoke("set_proxy", { proxyUrl });
      setError(proxyUrl ? "Traffic routed through proxy." : "Proxy disabled.");
    } catch (err: any) {
      handleApiError(err, "Failed to set proxy.");
    } finally {
      setLoading(false);
    }
  };

  return {
    gdprStatus,
    fetchPrivacyAudit,
    handleTriggerHarvest,
    handleMaxPrivacySanitize,
    handleProcessGdprData,
    handleSetProxy,
  };
};
