import type { SheetLogResponse, VatLogItem } from "../services/sheets";
import type { EntryType, SubmitState } from "../types";
import { formatDateDDMMYYYY } from "../utils";
import {
  LogSection as StyledLogSection,
  Tabs,
  Tab,
  LogHeader,
  LogList,
  LogRowContainer,
  Helper,
  Button,
  Input,
  DeleteButton,
  Row,
} from "../styles";
import { SelectionControls } from "./SelectionControls";
import { LogRow } from "./LogRow";

interface LogSectionProps {
  activeTab: "recent" | "filter";
  recentLogs: SheetLogResponse | null;
  logs: SheetLogResponse | null;
  logState: SubmitState;
  selectionMode: "totals" | "delete";
  onSelectionModeChange: (mode: "totals" | "delete") => void;
  selectedItems: Set<string>;
  dateFrom: string;
  dateTo: string;
  onTabChange: (tab: "recent" | "filter") => void;
  onFetchRecentItems: () => void;
  onFetchLogs: () => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteMultiple: () => void;
  onToggleSelection: (id: string, type: EntryType) => void;
  onDeleteEntry: (id: string, type: EntryType) => void;
  onUpdateStatus?: (id: string, status: 'spent' | 'requested' | 'claimed') => void;
  onUpdateMultipleStatus?: (status: 'spent' | 'requested' | 'claimed') => void;
  pendingStatusChanges?: Map<string, { from: 'spent' | 'requested' | 'claimed'; to: 'spent' | 'requested' | 'claimed'; description: string }>;
  onSubmitStatusChanges?: () => void;
}

function LogsContent({
  logs,
  vatLogs,
  selectionMode,
  onSelectionModeChange,
  selectedItems,
  onSelectAll,
  onClearSelection,
  onDeleteMultiple,
  onToggleSelection,
  onDeleteEntry,
  onUpdateStatus,
  onUpdateMultipleStatus,
  pendingStatusChanges,
  onSubmitStatusChanges,
}: {
  logs: SheetLogResponse | null;
  vatLogs?: VatLogItem[];
  selectionMode: "totals" | "delete";
  onSelectionModeChange: (mode: "totals" | "delete") => void;
  selectedItems: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteMultiple: () => void;
  onToggleSelection: (id: string, type: EntryType) => void;
  onDeleteEntry: (id: string, type: EntryType) => void;
  onUpdateStatus?: (id: string, status: 'spent' | 'requested' | 'claimed') => void;
  onUpdateMultipleStatus?: (status: 'spent' | 'requested' | 'claimed') => void;
  pendingStatusChanges?: Map<string, { from: 'spent' | 'requested' | 'claimed'; to: 'spent' | 'requested' | 'claimed'; description: string }>;
  onSubmitStatusChanges?: () => void;
}) {
  if (!logs) return null;

  const totals = (() => {
    if (selectionMode !== "totals") return undefined;
    let spendingSum = 0;
    let vatSum = 0;
    logs.spending?.forEach(item => {
      if (selectedItems.has(`spending:${item.id}`)) {
        spendingSum += item.amount || 0;
      }
    });
    vatLogs?.forEach(item => {
      if (selectedItems.has(`vatCollected:${item.id}`)) {
        vatSum += item.amount || 0;
      }
    });
    return { spending: spendingSum, vat: vatSum, remainingVat: vatSum - spendingSum };
  })();

  return (
    <>
      {!!logs.spending?.length && (
        <SelectionControls
          selectedCount={selectedItems.size}
          onSelectAll={onSelectAll}
          onClearSelection={onClearSelection}
          onDeleteSelected={onDeleteMultiple}
          onUpdateStatus={onUpdateMultipleStatus}
          selectionMode={selectionMode}
          onSelectionModeChange={onSelectionModeChange}
          totals={totals}
        />
      )}
      {pendingStatusChanges && pendingStatusChanges.size > 0 && onSubmitStatusChanges && (
        <div style={{ marginBottom: "12px", display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            onClick={onSubmitStatusChanges}
            style={{ background: "linear-gradient(135deg, #059669, #10b981)", fontSize: "14px", padding: "10px 20px" }}
          >
            Submit {pendingStatusChanges.size} Status Change{pendingStatusChanges.size > 1 ? 's' : ''}
          </Button>
        </div>
      )}
      <LogList>
        <div>
          <Row>
            <strong>Spending:</strong>
            <strong style={{color: '#213560'}}>Total: {logs.spending?.reduce((acc, item) => acc + item.amount, 0).toLocaleString("vi-VN")} đ</strong>
          </Row>
          {!!logs.spending?.length ? (
            <LogRowContainer>
              {logs.spending.map((item, idx) => (
                <LogRow
                  key={`sp-${item.id || idx}`}
                  item={item}
                  entryType="spending"
                  isSelected={selectedItems.has(`spending:${item.id}`)}
                  onSelect={() => onToggleSelection(item.id, "spending")}
                  onDelete={() => onDeleteEntry(item.id, "spending")}
                  onUpdateStatus={onUpdateStatus ? (id, status) => onUpdateStatus(id, status) : undefined}
                  pendingStatus={pendingStatusChanges?.get(item.id)?.to}
                />
              ))}
            </LogRowContainer>
          ) : (
            <Helper>No spending records.</Helper>
          )}
        </div>
        <div>
          <Row>
            <strong>VAT Collected:</strong>
            <strong style={{color: '#213560'}}>Total: {vatLogs?.reduce((acc, item) => acc + item.amount, 0).toLocaleString("vi-VN")} đ</strong>
          </Row>
          {!!vatLogs?.length ? (
            <LogRowContainer>
              {vatLogs.map((item, idx) => (
                <LogRow
                  key={`vat-${item.id || idx}`}
                  item={{ id: item.id, date: item.date, amount: item.amount, description: "VAT collected", status: "spent" }}
                  entryType="vatCollected"
                  isSelected={selectedItems.has(`vatCollected:${item.id}`)}
                  onSelect={() => onToggleSelection(item.id, "vatCollected")}
                  onDelete={() => onDeleteEntry(item.id, "vatCollected")}
                  showCheckbox={true}
                  onUpdateStatus={undefined}
                />
              ))}
            </LogRowContainer>
          ) : (
            <Helper>No VAT collected records.</Helper>
          )}
        </div>
      </LogList>
    </>
  );
}

export function LogSection({
  activeTab,
  recentLogs,
  logs,
  logState,
  selectionMode,
  onSelectionModeChange,
  selectedItems,
  dateFrom,
  dateTo,
  onTabChange,
  onFetchRecentItems,
  onFetchLogs,
  onDateFromChange,
  onDateToChange,
  onSelectAll,
  onClearSelection,
  onDeleteMultiple,
  onToggleSelection,
  onDeleteEntry,
  onUpdateStatus,
  onUpdateMultipleStatus,
  pendingStatusChanges,
  onSubmitStatusChanges,
}: LogSectionProps) {
  return (
    <StyledLogSection>
      <Tabs>
        <Tab
          type="button"
          $active={activeTab === "recent"}
          onClick={() => onTabChange("recent")}
        >
          Recent Records
        </Tab>
        <Tab
          type="button"
          $active={activeTab === "filter"}
          onClick={() => onTabChange("filter")}
        >
          Filter by Date
        </Tab>
      </Tabs>

      {activeTab === "recent" && (
        <>
          <LogHeader>
            <h3 style={{ margin: 0, fontSize: 16, color: "#213560" }}>
              Recent records
            </h3>
            <Button
              type="button"
              onClick={onFetchRecentItems}
              disabled={logState.status === "submitting"}
            >
              {logState.status === "submitting" ? "Loading…" : "Refresh"}
            </Button>
          </LogHeader>

          {logState.status === "error" && <Helper>{logState.message}</Helper>}
          {logState.status === "success" && (
            <Helper>{logState.message}</Helper>
          )}

          {recentLogs && logState.status !== "submitting" && (
            <LogsContent
              logs={recentLogs}
              vatLogs={recentLogs?.vat}
              selectionMode={selectionMode}
              onSelectionModeChange={onSelectionModeChange}
              selectedItems={selectedItems}
              onSelectAll={onSelectAll}
              onClearSelection={onClearSelection}
              onDeleteMultiple={onDeleteMultiple}
              onToggleSelection={onToggleSelection}
              onDeleteEntry={onDeleteEntry}
              onUpdateStatus={onUpdateStatus}
              onUpdateMultipleStatus={onUpdateMultipleStatus}
              pendingStatusChanges={pendingStatusChanges}
              onSubmitStatusChanges={onSubmitStatusChanges}
            />
          )}
        </>
      )}

      {activeTab === "filter" && (
        <>
          <LogHeader>
            <h3 style={{ margin: 0, fontSize: 16, color: "#213560" }}>
              Filter by Date
            </h3>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
            />
            <span style={{ color: "#64748b", textAlign: 'center' }}>to</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
            />
            <Button
              type="button"
              onClick={onFetchLogs}
              disabled={logState.status === "submitting"}
            >
              {logState.status === "submitting" ? "Loading…" : "Filter"}
            </Button>
          </LogHeader>

          {logState.status === "error" && <Helper>{logState.message}</Helper>}
          {logState.status === "success" && (
            <Helper>{logState.message}</Helper>
          )}

          {logs && logState.status !== "submitting" && (
            <LogsContent
              logs={logs}
              vatLogs={logs?.vat}
              selectionMode={selectionMode}
              onSelectionModeChange={onSelectionModeChange}
              selectedItems={selectedItems}
              onSelectAll={onSelectAll}
              onClearSelection={onClearSelection}
              onDeleteMultiple={onDeleteMultiple}
              onToggleSelection={onToggleSelection}
              onDeleteEntry={onDeleteEntry}
              onUpdateStatus={onUpdateStatus}
              onUpdateMultipleStatus={onUpdateMultipleStatus}
              pendingStatusChanges={pendingStatusChanges}
              onSubmitStatusChanges={onSubmitStatusChanges}
            />
          )}
        </>
      )}
    </StyledLogSection>
  );
}
