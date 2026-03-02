import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../store/authStore";

export const useVault = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setView } = useAuthStore();
  const [unlockPassword, setUnlockPassword] = useState("");
  const [newMasterPassword, setNewMasterPassword] = useState("");
  const [confirmMasterPassword, setConfirmMasterPassword] = useState("");

  const checkVaultLock = useCallback(async () => {
    try {
      const hasMaster = await invoke<boolean>("has_master_password");
      useAuthStore.getState().setHasMasterPassword(hasMaster);

      const locked = await invoke<boolean>("is_vault_locked");
      useAuthStore.getState().setLocked(locked);

      if (locked) {
        setView("unlock");
      }
    } catch (err) {
      console.error("Failed to check vault lock:", err);
    }
  }, [setView]);

  useEffect(() => {
    checkVaultLock();
  }, [checkVaultLock]);

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    useAuthStore.getState().setLoading(true);
    try {
      await invoke("unlock_vault", { password: unlockPassword });
      useAuthStore.getState().setLocked(false);
      setView("auth");
      useAuthStore.getState().setError(null);
      setUnlockPassword("");
    } catch (err: any) {
      handleApiError(err, "Unlock failed.");
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  const handleSetMasterPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newMasterPassword !== confirmMasterPassword) {
      useAuthStore.getState().setError("Passwords do not match.");
      return;
    }
    useAuthStore.getState().setLoading(true);
    try {
      await invoke("set_master_password", {
        password: newMasterPassword || null,
      });
      const hasMaster = !!newMasterPassword;
      useAuthStore.getState().setHasMasterPassword(hasMaster);
      useAuthStore.getState().setLocked(false);
      setView("auth");
      useAuthStore.getState().setError(null);
      setNewMasterPassword("");
      setConfirmMasterPassword("");
    } catch (err: any) {
      handleApiError(err, "Master password setup failed.");
    } finally {
      useAuthStore.getState().setLoading(false);
    }
  };

  return {
    unlockPassword,
    setUnlockPassword,
    newMasterPassword,
    setNewMasterPassword,
    confirmMasterPassword,
    setConfirmMasterPassword,
    checkVaultLock,
    handleUnlock,
    handleSetMasterPassword,
  };
};
