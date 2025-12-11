import type { SheetLogItem } from "../services/sheets";
import type { EntryType, SpendingStatus } from "../types";
import { formatDateDDMMYYYY, getStatusColor, getStatusLabel } from "../utils";
import { Checkbox, LogRow as StyledLogRow, DeleteButton, SelectRow, SelectButton } from "../styles";

interface LogRowProps {
  item: SheetLogItem;
  entryType: EntryType;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdateStatus?: (id: string, status: SpendingStatus) => void;
  showCheckbox?: boolean;
  pendingStatus?: SpendingStatus;
}

export function LogRow({ item, entryType, isSelected, onSelect, onDelete, onUpdateStatus, showCheckbox = true, pendingStatus }: LogRowProps) {
  const currentStatus = (item.status || "spent") as SpendingStatus;
  const displayStatus = pendingStatus || currentStatus;
  const hasPendingChange = pendingStatus !== undefined && pendingStatus !== currentStatus;

  return (
    <StyledLogRow>
      {showCheckbox && (
        <Checkbox
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
        />
      )}
      <span style={{ flex: 1 }}>{formatDateDDMMYYYY(item.date)}</span>
      {entryType === "spending" && (
        <span style={{ flex: 2 }}>{item.description || "—"}</span>
      )}
      {entryType === "spending" && onUpdateStatus && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", position: "relative" }}>
          <SelectRow style={{ padding: "2px", gap: "4px" }}>
            <SelectButton
              type="button"
              onClick={() => onUpdateStatus(item.id, "spent")}
              $active={displayStatus === "spent"}
              style={{ 
                padding: "6px 10px", 
                fontSize: "11px",
                opacity: hasPendingChange && displayStatus !== "spent" ? 0.5 : 1
              }}
            >
              Spent
            </SelectButton>
            <SelectButton
              type="button"
              onClick={() => onUpdateStatus(item.id, "requested")}
              $active={displayStatus === "requested"}
              style={{ 
                padding: "6px 10px", 
                fontSize: "11px",
                opacity: hasPendingChange && displayStatus !== "requested" ? 0.5 : 1
              }}
            >
              Requested
            </SelectButton>
            <SelectButton
              type="button"
              onClick={() => onUpdateStatus(item.id, "claimed")}
              $active={displayStatus === "claimed"}
              style={{ 
                padding: "6px 10px", 
                fontSize: "11px",
                opacity: hasPendingChange && displayStatus !== "claimed" ? 0.5 : 1
              }}
            >
              Claimed
            </SelectButton>
          </SelectRow>
          {hasPendingChange && (
            <div
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                background: "#f59e0b",
                color: "#ffffff",
                borderRadius: "50%",
                width: "18px",
                height: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                fontWeight: "bold",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              }}
              title="Status change pending"
            >
              !
            </div>
          )}
        </div>
      )}
      {entryType === "spending" && !onUpdateStatus && item.status && (
        <span style={{ flex: 1, color: getStatusColor(currentStatus), fontSize: "12px", fontWeight: 500 }}>
          {getStatusLabel(currentStatus)}
        </span>
      )}
      <strong style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {item.amount.toLocaleString("vi-VN")} đ
      </strong>
      <DeleteButton type="button" onClick={onDelete}>
        Delete
      </DeleteButton>
    </StyledLogRow>
  );
}
