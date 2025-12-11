import type { SpendingStatus } from "../types";

export function getStatusColor(status: SpendingStatus): string {
  switch (status) {
    case "spent": return "#dc2626";
    case "requested": return "#f59e0b";
    case "claimed": return "#059669";
    default: return "#213560";
  }
}

export function getStatusLabel(status: SpendingStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
