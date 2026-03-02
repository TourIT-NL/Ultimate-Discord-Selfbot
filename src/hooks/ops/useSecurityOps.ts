import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../../store/authStore";

export const useSecurityOps = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setLoading, setError } = useAuthStore();
  const [authorizedApps, setAuthorizedApps] = useState<any[]>([]);

  const fetchSecurityAudit = useCallback(async () => {
    setLoading(true);
    try {
      setAuthorizedApps(await invoke("fetch_oauth_tokens"));
    } catch (err: any) {
      handleApiError(err, "Failed to audit third-party apps.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, handleApiError]);

  const handleRevokeApp = async (tokenId: string) => {
    setLoading(true);
    try {
      await invoke("revoke_oauth_token", { tokenId });
      setError("Third-party authorization shredded.");
      fetchSecurityAudit(); // Refresh after revoking
    } catch (err: any) {
      handleApiError(err, "Failed to revoke access.");
    } finally {
      setLoading(false);
    }
  };

  const handleNitroWipe = async () => {
    setLoading(true);
    try {
      await invoke("nitro_stealth_wipe");
      setError("Nitro stealth wipe protocol execution complete.");
    } catch (err: any) {
      handleApiError(err, "Nitro stealth wipe failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleStealthWipe = async () => {
    setLoading(true);
    try {
      await invoke("stealth_privacy_wipe");
      setError("Stealth protocol execution complete.");
    } catch (err: any) {
      handleApiError(err, "Stealth wipe failed.");
    } finally {
      setLoading(false);
    }
  };

  return {
    authorizedApps,
    fetchSecurityAudit,
    handleRevokeApp,
    handleNitroWipe,
    handleStealthWipe,
  };
};
