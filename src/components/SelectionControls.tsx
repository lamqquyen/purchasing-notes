import {
  SelectionControls as StyledSelectionControls,
  SelectionActions,
  Button,
  DeleteButton,
  SelectRow,
  SelectButton,
  SelectionDescription,
  ActionsWrapper,
  TotalsContainer,
  TotalsItem,
  TotalsItemTitle,
  TotalsItemValue,
} from "../styles";
import type { SpendingStatus } from "../types";

interface SelectionControlsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onUpdateStatus?: (status: SpendingStatus) => void;
  selectionMode: "totals" | "delete";
  onSelectionModeChange: (mode: "totals" | "delete") => void;
  totals?: {
    spending: number;
    vat: number;
    remainingVat: number;
  };
}

export function SelectionControls({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onUpdateStatus,
  selectionMode,
  onSelectionModeChange,
  totals,
}: SelectionControlsProps) {
  const showTotals = selectionMode === "totals";
  return (
    <>
      {showTotals && totals && (
        <TotalsContainer>
          <TotalsItem>
            <TotalsItemTitle>Paid:</TotalsItemTitle>
            <TotalsItemValue>{totals.spending.toLocaleString("vi-VN")} đ</TotalsItemValue>
          </TotalsItem>
          <TotalsItem>
            <TotalsItemTitle>VAT collected:</TotalsItemTitle>
            <TotalsItemValue>{totals.vat.toLocaleString("vi-VN")} đ</TotalsItemValue>
          </TotalsItem>
          <TotalsItem>
            <TotalsItemTitle>Remaining:</TotalsItemTitle>
            <TotalsItemValue>{(totals.vat - totals.spending < 0
              ? Math.abs(totals.vat - totals.spending)
              : 0
            ).toLocaleString("vi-VN")} đ</TotalsItemValue>
          </TotalsItem>
        </TotalsContainer>
      )}
      <StyledSelectionControls>
        <SelectRow>
          <SelectButton
            type="button"
            $active={selectionMode === "totals"}
            onClick={() => onSelectionModeChange("totals")}
          >
            Totals
          </SelectButton>
          <SelectButton
            type="button"
            $active={selectionMode === "delete"}
            onClick={() => onSelectionModeChange("delete")}
          >
            Delete
          </SelectButton>
        </SelectRow>
        <ActionsWrapper>
          <SelectionActions style={{ flex: 1 }}>
            <Button
              type="button"
              onClick={onSelectAll}
              style={{
                background: "rgba(33, 53, 96, 0.1)",
                color: "#213560",
                fontSize: 12,
                padding: "6px 12px",
                width: "fit-content",
              }}
            >
              Select All
            </Button>
            {selectedCount > 0 && (
              <>
                <Button
                  type="button"
                  onClick={onClearSelection}
                  style={{
                    background: "#f1f5f9",
                    color: "#64748b",
                    fontSize: 12,
                    padding: "6px 12px",
                    width: "fit-content",
                  }}
                >
                  Clear
                </Button>
                {selectionMode === "delete" && (
                  <DeleteButton type="button" onClick={onDeleteSelected}>
                    Delete {selectedCount} item(s)
                  </DeleteButton>
                )}
              </>
            )}
          </SelectionActions>
          <SelectionDescription>
            {selectedCount > 0
              ? `${selectedCount} item(s) selected`
              : selectionMode === "totals"
              ? "Select items to see totals"
              : "Select multiple items to update or delete"}
          </SelectionDescription>
        </ActionsWrapper>
      </StyledSelectionControls>
    </>
  );
}
