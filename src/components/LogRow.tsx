import type { SheetLogItem } from "../services/sheets";
import type { EntryType } from "../types";
import { formatDateDDMMYYYY } from "../utils";
import { Checkbox, LogRow as StyledLogRow, DeleteButton } from "../styles";

interface LogRowProps {
  item: SheetLogItem;
  entryType: EntryType;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  showCheckbox?: boolean;
}

export function LogRow({ item, entryType, isSelected, onSelect, onDelete, showCheckbox = true }: LogRowProps) {
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
        <span style={{ flex: 3 }}>{item.description || "—"}</span>
      )}
      <strong style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        {item.amount.toLocaleString("vi-VN")}
      </strong>
      <DeleteButton type="button" onClick={onDelete}>
        Xóa
      </DeleteButton>
    </StyledLogRow>
  );
}
