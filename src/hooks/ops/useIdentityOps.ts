import { invoke } from "@tauri-apps/api/core";
import { useSelectionState } from "../useSelectionState";

export const useIdentityOps = (
  handleApiError: (err: any, fallback: string) => void,
) => {
  const { selectedRelationships } = useSelectionState();

  const startRelationshipCleanup = async () => {
    try {
      await invoke("bulk_cleanup_relationships", {
        userIds: Array.from(selectedRelationships),
        action: "remove", // Or could be parameterized if blocking is added
      });
    } catch (err) {
      handleApiError(err, "Relationship cleanup protocol failed.");
      throw err;
    }
  };

  return {
    startRelationshipCleanup,
  };
};
