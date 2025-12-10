import { SelectionControls as StyledSelectionControls, SelectionActions, Button, DeleteButton } from "../styles";

interface SelectionControlsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
}

export function SelectionControls({ selectedCount, onSelectAll, onClearSelection, onDeleteSelected }: SelectionControlsProps) {
  return (
    <StyledSelectionControls>
      <span style={{ fontSize: 14, color: "#64748b" }}>
        {selectedCount > 0 ? `Đã chọn ${selectedCount} mục` : "Chọn nhiều mục để xóa"}
      </span>
      <SelectionActions>
        <Button
          type="button"
          onClick={onSelectAll}
          style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 12, padding: "6px 12px", flex: 1 }}
        >
          Chọn tất cả
        </Button>
        {selectedCount > 0 && (
          <>
            <Button
              type="button"
              onClick={onClearSelection}
              style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "6px 12px", flex: 1 }}
            >
              Bỏ chọn
            </Button>
            <DeleteButton
              type="button"
              onClick={onDeleteSelected}
              style={{ flex: 1 }}
            >
              Xóa {selectedCount} mục
            </DeleteButton>
          </>
        )}
      </SelectionActions>
    </StyledSelectionControls>
  );
}
