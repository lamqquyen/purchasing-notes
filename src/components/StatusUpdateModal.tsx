import { Button, DeleteButton } from "../styles";
import type { SpendingStatus } from "../types";
import { getStatusColor, getStatusLabel } from "../utils";

interface StatusChange {
  id: string;
  description: string;
  from: SpendingStatus;
  to: SpendingStatus;
}

interface StatusUpdateModalProps {
  changes: StatusChange[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function StatusUpdateModal({ changes, onConfirm, onCancel }: StatusUpdateModalProps) {

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
        padding: "20px",
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 80px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 16px 0", color: "#213560", fontSize: "20px" }}>
          Confirm Status Updates
        </h2>
        <p style={{ margin: "0 0 20px 0", color: "#64748b", fontSize: "14px" }}>
          You are about to update {changes.length} item(s). Please review the changes:
        </p>
        
        <div style={{ marginBottom: "24px", maxHeight: "400px", overflow: "auto" }}>
          {changes.map((change) => (
            <div
              key={change.id}
              style={{
                padding: "12px",
                marginBottom: "8px",
                background: "#f8fafc",
                borderRadius: "8px",
                border: "1px solid rgba(30, 58, 138, 0.1)",
              }}
            >
              <div style={{ marginBottom: "8px", fontWeight: 600, color: "#0f172a" }}>
                {change.description || "—"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
                <span style={{ color: "#64748b" }}>From:</span>
                <span
                  style={{
                    color: getStatusColor(change.from),
                    fontWeight: 600,
                    padding: "4px 8px",
                    background: `${getStatusColor(change.from)}20`,
                    borderRadius: "4px",
                  }}
                >
                  {getStatusLabel(change.from)}
                </span>
                <span style={{ color: "#64748b", margin: "0 4px" }}>→</span>
                <span style={{ color: "#64748b" }}>To:</span>
                <span
                  style={{
                    color: getStatusColor(change.to),
                    fontWeight: 600,
                    padding: "4px 8px",
                    background: `${getStatusColor(change.to)}20`,
                    borderRadius: "4px",
                  }}
                >
                  {getStatusLabel(change.to)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button
            type="button"
            onClick={onCancel}
            style={{
              background: "#f1f5f9",
              color: "#64748b",
              flex: 1,
            }}
          >
            No, Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            style={{ flex: 1 }}
          >
            Yes, Update
          </Button>
        </div>
      </div>
    </div>
  );
}

