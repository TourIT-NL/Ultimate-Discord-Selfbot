import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useSelectionState } from "../useSelectionState";

export const useMessageOps = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { selectedChannels } = useSelectionState();
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [purgeReactions, setPurgeReactions] = useState(false);
  const [onlyAttachments, setOnlyAttachments] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [closeEmptyDms, setCloseEmptyDms] = useState(false);

  const startMessageDeletion = async () => {
    const now = Date.now();
    const start =
      timeRange === "24h"
        ? now - 86400000
        : timeRange === "7d"
          ? now - 604800000
          : undefined;

    try {
      await invoke("bulk_delete_messages", {
        options: {
          channelIds: Array.from(selectedChannels),
          startTime: start,
          endTime: undefined,
          searchQuery: searchQuery || undefined,
          purgeReactions,
          simulation,
          onlyAttachments,
          closeEmptyDms,
        },
      });
    } catch (err) {
      handleApiError(err, "Message deletion protocol failed.");
      // Re-throw to allow the caller to handle process state
      throw err;
    }
  };

  return {
    timeRange,
    setTimeRange,
    searchQuery,
    setSearchQuery,
    purgeReactions,
    setPurgeReactions,
    onlyAttachments,
    setOnlyAttachments,
    simulation,
    setSimulation,
    closeEmptyDms,
    setCloseEmptyDms,
    startMessageDeletion,
  };
};
