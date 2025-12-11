import { SelectionControls as StyledSelectionControls, SelectionActions, Button, DeleteButton, SelectRow, SelectButton } from "../styles";
import type { SpendingStatus } from "../types";

interface SelectionControlsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onUpdateStatus?: (status: SpendingStatus) => void;
}

export function SelectionControls({ selectedCount, onSelectAll, onClearSelection, onDeleteSelected, onUpdateStatus }: SelectionControlsProps) {
  return (
    <StyledSelectionControls>
      <span style={{ fontSize: 14, color: "#64748b" }}>
        {selectedCount > 0 ? `${selectedCount} item(s) selected` : "Select multiple items to update or delete"}
      </span>
      <SelectionActions>
        <Button
          type="button"
          onClick={onSelectAll}
          style={{ background: "rgba(33, 53, 96, 0.1)", color: "#213560", fontSize: 12, padding: "6px 12px", flex: 1 }}
        >
          Select All
        </Button>
        {selectedCount > 0 && (
          <>
            <Button
              type="button"
              onClick={onClearSelection}
              style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "6px 12px", flex: 1 }}
            >
              Clear
            </Button>
            <DeleteButton
              type="button"
              onClick={onDeleteSelected}
              style={{ flex: 1 }}
            >
              Delete {selectedCount} item(s)
            </DeleteButton>
          </>
        )}
      </SelectionActions>
    </StyledSelectionControls>
  );
}
