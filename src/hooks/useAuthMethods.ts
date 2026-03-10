import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../store/authStore";

export const useAuthMethods = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setLoading, setError, setView } = useAuthStore();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrScanned, setQrScanned] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [rpcQrClientIdOverride, setRpcQrClientIdOverride] = useState("");

  const handleLoginOAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await invoke("start_oauth_flow");
    } catch (err: any) {
      if (err.error_code === "credentials_missing") {
        setView("setup");
        setError(err.user_message);
      } else {
        handleApiError(err, "OAuth handshake failed.");
      }
      setLoading(false);
    }
  };

  const handleLoginQR = async () => {
    setView("qr");
    setQrUrl(null);
    setQrScanned(false);
    try {
      await invoke("start_qr_login_flow");
    } catch (err: any) {
      if (err?.error_code === "client_id_not_found") {
        setError(
          "Automatic configuration failed. A Client ID is required for QR login. Please enter one below.",
        );
        setView("setup");
      } else {
        handleApiError(err, "QR Gateway failed.");
        setView("auth");
      }
    }
  };

  const handleCancelQR = async () => {
    setLoading(false);
    setView("auth");
    try {
      await invoke("cancel_qr_login");
    } catch (err) {
      console.error("Failed to cancel QR login:", err);
    }
  };

  const handleLoginRPC = async () => {
    setLoading(true);
    setError(null);
    try {
      await invoke("login_with_rpc");
    } catch (err: any) {
      if (err?.error_code === "client_id_not_found") {
        setError(
          "Automatic configuration failed. A Client ID is required for RPC login. Please enter one below.",
        );
        setView("setup");
      } else if (err.error_code === "credentials_missing") {
        setView("setup");
        setError(err.user_message);
      } else {
        handleApiError(err, "RPC handshake failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginToken = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await invoke("login_with_user_token", {
        token: manualToken
          .trim()
          .replace(/^Bearer\s+/i, "")
          .replace(/^"|"$/g, ""),
      });
      setError(null);
      setLoading(false);
      setView("dashboard");
    } catch (err: any) {
      handleApiError(err, "Identity validation failed.");
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await invoke("save_discord_credentials", { clientId, clientSecret });
      setView("auth");
      setError(null);
      setTimeout(handleLoginOAuth, 1500);
    } catch (err: any) {
      handleApiError(err, "Secure storage failure.");
    }
  };

  const handleSetRpcQrClientIdOverride = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await invoke("set_client_id_credential", {
        clientId: rpcQrClientIdOverride,
      });
      setError(null);
      // You might want to trigger a status check here if it's relevant
      setRpcQrClientIdOverride(""); // Clear after saving
    } catch (err: any) {
      handleApiError(err, "Failed to set RPC/QR Client ID override.");
    } finally {
      setLoading(false);
    }
  };

  return {
    qrUrl,
    setQrUrl,
    qrScanned,
    setQrScanned,
    manualToken,
    setManualToken,
    clientId,
    setClientId,
    clientSecret,
    setClientSecret,
    rpcQrClientIdOverride,
    setRpcQrClientIdOverride,
    handleLoginOAuth,
    handleLoginQR,
    handleCancelQR,
    handleLoginRPC,
    handleLoginToken,
    handleSaveConfig,
    handleSetRpcQrClientIdOverride,
  };
};
