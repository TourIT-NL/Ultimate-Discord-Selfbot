import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../../store/authStore";

export const useAccountOps = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setLoading, setError } = useAuthStore();
  const [billingInfo, setBillingInfo] = useState<any>(null);

  const fetchAccountAudit = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentSources, subscriptions] = await Promise.all([
        invoke("fetch_payment_sources"),
        invoke("fetch_billing_subscriptions"),
      ]);
      setBillingInfo({ paymentSources, subscriptions });
    } catch (err: any) {
      handleApiError(err, "Failed to fetch financial footprint.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, handleApiError]);

  const handleSetHypesquad = async (houseId: number) => {
    setLoading(true);
    try {
      await invoke("set_hypesquad", { houseId });
      setError(`Hypesquad affiliation updated to House ${houseId}.`);
    } catch (err: any) {
      handleApiError(err, "Failed to update Hypesquad.");
    } finally {
      setLoading(false);
    }
  };

  const handleGhostProfile = async () => {
    setLoading(true);
    try {
      await invoke("ghost_profile");
      setError("Profile Ghosting protocol complete.");
    } catch (err: any) {
      handleApiError(err, "Profile ghosting failed.");
    } finally {
      setLoading(false);
    }
  };

  return {
    billingInfo,
    fetchAccountAudit,
    handleSetHypesquad,
    handleGhostProfile,
  };
};
