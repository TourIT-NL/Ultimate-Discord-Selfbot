import { useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useAuthStore } from "../store/authStore";
import { useSelectionState } from "./useSelectionState";
import { useOperationControl } from "./useOperationControl";
import { useMessageOps } from "./ops/useMessageOps";
import { useServerOps } from "./ops/useServerOps";
import { useIdentityOps } from "./ops/useIdentityOps";
import { useSecurityOps } from "./ops/useSecurityOps";
import { usePrivacyOps } from "./ops/usePrivacyOps";
import { useAccountOps } from "./ops/useAccountOps";
import { useExportOps } from "./ops/useExportOps";
import { useGeneralOps } from "./ops/useGeneralOps";
import { PreviewMessage, Channel } from "../types/discord";

export const useDiscordOperations = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setGuilds, setLoading } = useAuthStore();
  const isFetchingGuildsRef = useRef(false);

  const [mode, setMode] = useState<
    | "messages"
    | "servers"
    | "identity"
    | "security"
    | "privacy"
    | "account"
    | "export"
  >("messages");
  const [confirmText, setConfirmText] = useState("");

  const selection = useSelectionState();
  const control = useOperationControl();
  const messageOps = useMessageOps(handleApiError);
  const serverOps = useServerOps(handleApiError);
  const identityOps = useIdentityOps(handleApiError);
  const securityOps = useSecurityOps(handleApiError);
  const privacyOps = usePrivacyOps(handleApiError);
  const accountOps = useAccountOps(handleApiError);
  const exportOps = useExportOps(handleApiError);
  const generalOps = useGeneralOps(
    handleApiError,
    control.setIsProcessing,
    control.setIsComplete,
  );

  const fetchGuilds = useCallback(
    async (forceRefresh: boolean = false) => {
      const state = useAuthStore.getState();
      if (
        !forceRefresh &&
        state.guilds &&
        state.guilds.length > 0 &&
        !isFetchingGuildsRef.current
      ) {
        return;
      }
      if (isFetchingGuildsRef.current) {
        return;
      }

      isFetchingGuildsRef.current = true;
      setLoading(true);
      try {
        setGuilds(await invoke("fetch_guilds"));
      } catch (err: any) {
        handleApiError(err, "Failed to load servers.");
      } finally {
        setLoading(false);
        isFetchingGuildsRef.current = false;
      }
    },
    [setLoading, setGuilds, handleApiError],
  );

  const fetchRelationships = useCallback(async () => {
    setLoading(true);
    try {
      selection.setRelationships(await invoke("fetch_relationships"));
    } catch (err: any) {
      handleApiError(err, "Failed to load identity links.");
    } finally {
      setLoading(false);
    }
  }, [setLoading, selection.setRelationships, handleApiError]);

  const startAction = async () => {
    const required =
      mode === "messages" ? "DELETE" : mode === "servers" ? "LEAVE" : "REMOVE";
    if (confirmText !== required) return;

    control.setIsProcessing(true);
    control.setIsComplete(false);
    setConfirmText("");

    try {
      if (mode === "messages") {
        await messageOps.startMessageDeletion();
      } else if (mode === "servers") {
        await serverOps.startServerLeave();
      } else if (mode === "identity") {
        await identityOps.startRelationshipCleanup();
      }
    } catch (err) {
      control.setIsProcessing(false);
    }
  };

  const fetchPreview = async (channelId: string) => {
    try {
      selection.setPreviews(
        await invoke<PreviewMessage[]>("fetch_preview_messages", { channelId }),
      );
    } catch (err) {
      // Ignore preview errors for now
    }
  };

  const handleToggleChannel = (id: string) => {
    const next = new Set(selection.selectedChannels);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selection.setSelectedChannels(next);
    if (!next.has(id)) selection.setPreviews([]);
    else fetchPreview(id);
  };

  const handleToggleGuildSelection = async (guild: any | null) => {
    const effectiveId = guild?.id || "dms";

    selection.setSelectedGuilds((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(effectiveId)) {
        next.delete(effectiveId);
      } else {
        next.add(effectiveId);
      }
      return next;
    });

    if (!selection.selectedGuilds.has(effectiveId)) {
      if (selection.channelsByGuild.has(effectiveId)) {
        return;
      }

      setLoading(true);
      try {
        const fetchedChannels: Channel[] = await invoke("fetch_channels", {
          guildId: guild?.id || null,
        });
        selection.setChannelsByGuild((prev: Map<string, Channel[]>) => {
          const next = new Map(prev);
          next.set(effectiveId, fetchedChannels);
          return next;
        });
      } catch (err: any) {
        handleApiError(
          err,
          `Failed to load buffers for ${guild?.name || "Direct Messages"}.`,
        );
        selection.setSelectedGuilds((prev: Set<string>) => {
          const next = new Set(prev);
          next.delete(effectiveId);
          return next;
        });
      } finally {
        setLoading(false);
      }
    } else {
      selection.setChannelsByGuild((prev: Map<string, Channel[]>) => {
        const next = new Map(prev);
        const removedChannels = next.get(effectiveId) || [];
        next.delete(effectiveId);

        selection.setSelectedChannels((prevSelected: Set<string>) => {
          const nextSelected = new Set(prevSelected);
          removedChannels.forEach((c: Channel) => nextSelected.delete(c.id));
          return nextSelected;
        });

        return next;
      });
    }
  };

  return {
    mode,
    setMode,
    confirmText,
    setConfirmText,
    fetchGuilds,
    fetchRelationships,
    startAction,
    handleToggleChannel,
    handleToggleGuildSelection,
    ...selection,
    ...control,
    ...messageOps,
    ...serverOps,
    ...identityOps,
    ...securityOps,
    ...privacyOps,
    ...accountOps,
    ...exportOps,
    ...generalOps,
  };
};
