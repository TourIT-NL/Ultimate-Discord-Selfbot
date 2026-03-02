import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../store/authStore";
import { useVault } from "./useVault";
import { useAuthMethods } from "./useAuthMethods";
import { useDiscordPresence } from "./useDiscordPresence";

export const useDiscordAuth = () => {
  const { setLoading, setError, reset, view, setView } = useAuthStore();

  const handleApiError = useCallback(
    (err: any, fallback: string) => {
      const msg = typeof err === "string" ? err : err.user_message || fallback;
      const detail = err.technical_details ? ` (${err.technical_details})` : "";
      const formattedMsg = `${msg}${detail}`;

      console.group(`[API Error] ${fallback}`);
      console.error("Original Error:", err);
      // Safely parse and log technical details
      if (err.technical_details) {
        try {
          console.error(
            "Technical Details:",
            JSON.parse(err.technical_details),
          );
        } catch {
          console.error("Technical Details:", err.technical_details);
        }
      }
      console.groupEnd();

      setError(formattedMsg, err);
      setLoading(false);
    },
    [setError, setLoading],
  );

  const vault = useVault(handleApiError);
  const authMethods = useAuthMethods(handleApiError);
  const presence = useDiscordPresence(handleApiError);

  const handleLogout = async () => {
    try {
      await invoke("logout");
    } catch (err) {
      console.error("Failed to clear active session in backend:", err);
    }
    reset();
    setView("manual");
  };

  return {
    view,
    setView,
    handleApiError,
    handleLogout,
    ...vault,
    ...authMethods,
    ...presence,
  };
};
