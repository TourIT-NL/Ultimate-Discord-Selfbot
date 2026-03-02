import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useAuthStore } from "../../store/authStore";
import { useSelectionState } from "../useSelectionState";
import { useOperationControl } from "../useOperationControl";

export const useExportOps = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { setError } = useAuthStore();
  const { selectedChannels, selectedGuilds } = useSelectionState();
  const { setIsProcessing, setIsComplete } = useOperationControl();

  const [exportDirection, setExportDirection] = useState<
    "sent" | "received" | "both"
  >("both");
  const [includeAttachmentsInHtml, setIncludeAttachmentsInHtml] =
    useState(true);

  const handleStartExport = async (format: "html" | "raw") => {
    if (selectedChannels.size === 0) {
      setError("Please select at least one channel to export.");
      return;
    }

    const selectedPath = await open({
      directory: true,
      multiple: false,
      title: "Select Output Directory",
    });

    if (!selectedPath) return;

    setIsProcessing(true);
    setIsComplete(false);
    try {
      if (format === "raw") {
        await invoke("start_attachment_harvest", {
          options: {
            channelIds: Array.from(selectedChannels),
            direction: exportDirection,
            includeAttachments: true,
            exportFormat: "raw",
            outputPath: selectedPath,
          },
        });
      } else {
        await invoke("start_chat_html_export", {
          options: {
            channelIds: Array.from(selectedChannels),
            direction: "both",
            includeAttachments: includeAttachmentsInHtml,
            exportFormat: "html",
            outputPath: selectedPath,
          },
        });
      }
    } catch (err: any) {
      handleApiError(err, "Export protocol failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartGuildArchive = async () => {
    if (selectedGuilds.size === 0) {
      setError("Please select a guild to archive.");
      return;
    }
    const guildId = Array.from(selectedGuilds)[0];
    if (guildId === "dms") {
      setError("Guild archive protocol is not applicable to DMs.");
      return;
    }

    const selectedPath = await save({
      filters: [{ name: "Archive", extensions: ["zip"] }],
      defaultPath: `archive_${guildId}.zip`,
    });

    if (!selectedPath) return;

    setIsProcessing(true);
    setIsComplete(false);
    try {
      await invoke("start_guild_user_archive", {
        guildId,
        outputPath: selectedPath,
      });
    } catch (err: any) {
      handleApiError(err, "Guild archival failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    exportDirection,
    setExportDirection,
    includeAttachmentsInHtml,
    setIncludeAttachmentsInHtml,
    handleStartExport,
    handleStartGuildArchive,
  };
};
