import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  deleteEntry,
  updateEntryStatus,
  fetchLogsByDateRange,
  fetchTotal,
  fetchOverallTotals,
  logEntry,
  type SheetLogResponse,
  type OverallTotals,
} from "./services/sheets";
import type { EntryType, FormValues, SpendingItem, SpendingStatus, SubmitState } from "./types";
import {
  sortLogsByDateDesc,
  getTodayVNT,
  getDefaultDateRange,
  getPastTwoDaysRange,
  convertDDMMYYYYToYYYYMMDD,
  requiredMessage,
} from "./utils";
import {
  GlobalStyle,
  Page,
  Card,
  Header,
  LogoContainer,
  Title,
  Badge,
  Tabs,
  Tab,
} from "./styles";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { TotalDisplay } from "./components/TotalDisplay";
import { TransactionForm } from "./components/TransactionForm";
import { LogSection } from "./components/LogSection";
import { StatusUpdateModal } from "./components/StatusUpdateModal";
import logo from "./logo.svg";


function App() {
  const [type, setType] = useState<EntryType>("spending");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });
  const [total, setTotal] = useState<number | null>(null);
  const [overallTotals, setOverallTotals] = useState<OverallTotals | null>(null);
  const defaultDateRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultDateRange.from);
  const [dateTo, setDateTo] = useState(defaultDateRange.to);
  const [logs, setLogs] = useState<SheetLogResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<SheetLogResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"recent" | "filter">("recent");
  const [logState, setLogState] = useState<SubmitState>({ status: "idle" });
  const [lastSubmittedDate, setLastSubmittedDate] = useState<string | null>(null);
  const [spendingItems, setSpendingItems] = useState<SpendingItem[]>([
    { id: "1", description: "", amount: 0, status: "spent", amountError: undefined, descriptionError: undefined }
  ]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Map<string, { from: SpendingStatus; to: SpendingStatus; description: string }>>(new Map());
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [mainTab, setMainTab] = useState<"create" | "track">("create");
  const [totalDisplayRefreshKey, setTotalDisplayRefreshKey] = useState(0);
  const {
    register,
    handleSubmit,
    reset,
    resetField,
    watch,
    setValue,
    trigger,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      amount: 0,
      description: "",
      occurredAt: getTodayVNT(), // Use YYYY-MM-DD format for date input
    },
    shouldUnregister: true,
  });
  
  const amountValue = watch("amount");


  // Helper function to fetch recent items by creation date (past 2 days)
  const fetchRecentItemsByCreationDate = async (): Promise<SheetLogResponse> => {
    const pastTwoDaysRange = getPastTwoDaysRange();
    // Backend now filters by creation date, so we can directly use the date range
    return fetchLogsByDateRange(pastTwoDaysRange.from, pastTwoDaysRange.to);
  };

  // Fetch total and recent items on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [totalValue, overallTotalsValue, filteredData] = await Promise.all([
          fetchTotal(),
          fetchOverallTotals(),
          fetchRecentItemsByCreationDate()
        ]);
        setTotal(totalValue);
        setOverallTotals(overallTotalsValue);
        setRecentLogs(sortLogsByDateDesc(filteredData));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    loadData();
  }, []);

  const onFetchRecentItems = async () => {
    setLogState({ status: "submitting" });
    try {
      const filteredData = await fetchRecentItemsByCreationDate();
      setRecentLogs(sortLogsByDateDesc(filteredData));
      setLogState({ status: "success", message: "Data loaded." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load data.";
      setLogState({ status: "error", message });
    }
  };

  const statusTone = useMemo(() => {
    if (submitState.status === "success") return "success";
    if (submitState.status === "error") return "error";
    return "muted";
  }, [submitState.status]);

  const addSpendingItem = () => {
    setSpendingItems([...spendingItems, { id: Date.now().toString(), description: "", amount: 0, status: "spent", amountError: undefined, descriptionError: undefined }]);
  };

  const removeSpendingItem = (id: string) => {
    if (spendingItems.length > 1) {
      setSpendingItems(spendingItems.filter(item => item.id !== id));
    }
  };

  const updateSpendingItem = (id: string, field: "description" | "amount" | "status", value: string | number | SpendingStatus) => {
    setSpendingItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        // Don't validate on change, only update the value
        // Validation will happen on blur
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSpendingItemBlur = (id: string, field: "description" | "amount", value: string | number) => {
    if (field === "description") {
      setSpendingItems(prevItems => prevItems.map(i => {
        if (i.id === id) {
          if (!String(value).trim()) {
            return { ...i, descriptionError: requiredMessage };
          } else {
            return { ...i, descriptionError: undefined };
          }
        }
        return i;
      }));
    } else if (field === "amount") {
      const numValue = typeof value === "number" ? value : parseFloat(String(value));
      setSpendingItems(prevItems => prevItems.map(i => {
        if (i.id === id) {
          if (!numValue || numValue <= 0 || isNaN(numValue)) {
            return { ...i, amountError: "Value must be greater than 0" };
          } else {
            return { ...i, amountError: undefined };
          }
        }
        return i;
      }));
    }
  };

  const handleTypeChange = (newType: EntryType) => {
    setType(newType);
    setSpendingItems([{ id: Date.now().toString(), description: "", amount: 0, status: "spent", amountError: undefined, descriptionError: undefined }]);
  };

  const onSubmit = handleSubmit(async (data) => {
    // Convert date from dd/MM/yyyy to yyyy-MM-dd for API
    const dateForAPI = convertDDMMYYYYToYYYYMMDD(data.occurredAt);
    const currentDate = data.occurredAt;
    
    // Validate spending items before submitting
    if (type === "spending") {
      // Validate all spending items and set errors
      let hasErrors = false;
      const updatedItems = spendingItems.map(item => {
        const updated = { ...item };
        if (!item.description.trim()) {
          updated.descriptionError = requiredMessage;
          hasErrors = true;
        } else {
          updated.descriptionError = undefined;
        }
        if (!item.amount || item.amount <= 0) {
          updated.amountError = "Value must be greater than 0";
          hasErrors = true;
        } else {
          updated.amountError = undefined;
        }
        return updated;
      });
      
      // Update state with errors so they display in UI
      setSpendingItems(updatedItems);
      
      if (hasErrors) {
        setSubmitState({ status: "error", message: "Please check the entered fields." });
        return;
      }
      
      const validItems = spendingItems.filter(item => item.description.trim() && item.amount > 0);
      if (validItems.length === 0) {
        setSubmitState({ status: "error", message: "Please enter at least one valid spending item." });
        return;
      }
      
      // Proceed with submission for spending
      setSubmitState({ status: "submitting" });
      setIsOperationLoading(true);
      
      // Call API
      Promise.all(
        validItems.map((item: SpendingItem) =>
          logEntry({
            type: "spending",
            occurredAt: dateForAPI,
            amount: item.amount,
            description: item.description,
            status: item.status,
          })
        )
      )
        .then(async () => {
          // Refresh both recentLogs and totals (always refresh recent after submission)
          try {
            await refreshData(true);
            setTotalDisplayRefreshKey(prev => prev + 1); // Trigger TotalDisplay refresh
          } catch (e) {
            console.error("Failed to refresh data:", e);
          } finally {
            setIsOperationLoading(false);
          }
          
          setSubmitState({
            status: "success",
            message: `Successfully saved ${validItems.length} item(s)!`,
          });
          
          // Keep the date for "add more" functionality
          setLastSubmittedDate(currentDate);
          
          // Reset form
          setSpendingItems([{ id: Date.now().toString(), description: "", amount: 0, status: "spent", amountError: undefined, descriptionError: undefined }]);
          
          // Switch to track tab and recent sub-tab
          setMainTab("track");
          setActiveTab("recent");
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Unable to log transaction at this time.";
          setSubmitState({ status: "error", message });
          setIsOperationLoading(false);
        });
    }
  });

  const onFetchLogs = async () => {
    if (!dateFrom || !dateTo) {
      setLogState({ status: "error", message: "Please select a date range to search." });
      return;
    }
    if (dateFrom > dateTo) {
      setLogState({ status: "error", message: "Start date must be less than or equal to end date." });
      return;
    }
    setLogState({ status: "submitting" });
    try {
      const data = await fetchLogsByDateRange(dateFrom, dateTo);
      setLogs(sortLogsByDateDesc(data));
      setLogState({ status: "success", message: "Data loaded." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load data.";
      setLogState({ status: "error", message });
    }
  };

  const toggleItemSelection = (id: string, entryType: EntryType) => {
    const key = `${entryType}:${id}`;
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAllItems = () => {
    const allItems = new Set<string>();
    if (activeTab === "recent" && recentLogs) {
      recentLogs.spending?.forEach(item => allItems.add(`spending:${item.id}`));
    } else if (activeTab === "filter" && logs) {
      logs.spending?.forEach(item => allItems.add(`spending:${item.id}`));
    }
    setSelectedItems(allItems);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Helper function to refresh data after operations
  const refreshData = async (forceRecent?: boolean) => {
    const promises: Promise<any>[] = [fetchTotal(), fetchOverallTotals()];
    
    if (forceRecent || activeTab === "recent") {
      promises.push(fetchRecentItemsByCreationDate());
    } else if (activeTab === "filter" && dateFrom && dateTo) {
      promises.push(fetchLogsByDateRange(dateFrom, dateTo));
    }
    
    const results = await Promise.all(promises);
    setTotal(results[0]);
    setOverallTotals(results[1]);
    
    if (forceRecent || activeTab === "recent") {
      if (results[2]) {
        setRecentLogs(sortLogsByDateDesc(results[2]));
      }
    } else if (activeTab === "filter" && results[2]) {
      setLogs(sortLogsByDateDesc(results[2]));
    }
  };

  const onDeleteMultipleEntries = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} selected record(s)?`)) return;

    // Parse selected items into {id, type} pairs
    const itemsToDelete: Array<{ id: string; type: EntryType }> = [];

    selectedItems.forEach(key => {
      const [type, id] = key.split(':') as [EntryType, string];
      itemsToDelete.push({ id, type });
    });

    // Clear selection
    setSelectedItems(new Set());

    // Show loading overlay
    setIsOperationLoading(true);

    // Call backend
    Promise.all(itemsToDelete.map(({ id, type }) => deleteEntry(id, type)))
      .then(async () => {
        try {
          await refreshData();
          setTotalDisplayRefreshKey(prev => prev + 1); // Trigger TotalDisplay refresh
        } catch (e) {
          console.error("Failed to refresh data:", e);
        } finally {
          setIsOperationLoading(false);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to delete record on server.";
        setLogState({ status: "error", message });
        setIsOperationLoading(false);
      });
  };

  const onDeleteEntry = async (id: string, entryType: EntryType) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    
    // Show loading overlay
    setIsOperationLoading(true);
    
    // Call backend
    deleteEntry(id, entryType)
      .then(async () => {
        try {
          await refreshData();
          setTotalDisplayRefreshKey(prev => prev + 1); // Trigger TotalDisplay refresh
        } catch (e) {
          console.error("Failed to refresh data:", e);
        } finally {
          setIsOperationLoading(false);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to delete record on server.";
        setLogState({ status: "error", message });
        setIsOperationLoading(false);
      });
  };

  const onStatusChange = (id: string, newStatus: SpendingStatus) => {
    // Find the current item to get its current status and description
    const currentLogs = activeTab === "recent" ? recentLogs : logs;
    const item = currentLogs?.spending?.find(i => i.id === id);
    
    if (!item) return;
    
    const currentStatus = (item.status || "spent") as SpendingStatus;
    
    // If changing to the same status, remove from pending changes
    if (currentStatus === newStatus) {
      setPendingStatusChanges(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    
    // Add to pending changes
    setPendingStatusChanges(prev => {
      const next = new Map(prev);
      // If already in pending, use the original 'from' status, otherwise use current
      const fromStatus = next.has(id) ? next.get(id)!.from : currentStatus;
      next.set(id, {
        from: fromStatus,
        to: newStatus,
        description: item.description || "—"
      });
      return next;
    });
  };

  const onSubmitStatusChanges = () => {
    if (pendingStatusChanges.size === 0) return;
    setShowStatusModal(true);
  };

  const onConfirmStatusChanges = async () => {
    setShowStatusModal(false);
    
    if (pendingStatusChanges.size === 0) return;
    
    // Show loading overlay
    setIsOperationLoading(true);
    
    // Convert pending changes to array
    const changes = Array.from(pendingStatusChanges.entries()).map(([id, change]) => ({
      id,
      status: change.to
    }));
    
    // Call backend for all items
    Promise.all(changes.map(({ id, status }) => updateEntryStatus(id, "spending", status)))
      .then(async () => {
        // Clear pending changes
        setPendingStatusChanges(new Map());
        
        try {
          await refreshData();
        } catch (e) {
          console.error("Failed to refresh data:", e);
        } finally {
          setIsOperationLoading(false);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to update status on server.";
        setLogState({ status: "error", message });
        setIsOperationLoading(false);
      });
  };

  const onCancelStatusChanges = () => {
    setShowStatusModal(false);
    // Optionally clear pending changes on cancel
    // setPendingStatusChanges(new Map());
  };

  const onUpdateMultipleStatus = async (status: SpendingStatus) => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Are you sure you want to update ${selectedItems.size} selected record(s) to "${status}"?`)) return;

    // Parse selected items into {id, type} pairs
    const itemsToUpdate: Array<{ id: string; type: EntryType }> = [];

    selectedItems.forEach(key => {
      const [type, id] = key.split(':') as [EntryType, string];
      itemsToUpdate.push({ id, type });
    });

    // Clear selection
    setSelectedItems(new Set());

    // Show loading overlay
    setIsOperationLoading(true);

    // Call backend for all items
    Promise.all(itemsToUpdate.map(({ id, type }) => updateEntryStatus(id, type, status)))
      .then(async () => {
        try {
          await refreshData();
          setTotalDisplayRefreshKey(prev => prev + 1); // Trigger TotalDisplay refresh
        } catch (e) {
          console.error("Failed to refresh data:", e);
        } finally {
          setIsOperationLoading(false);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Failed to update status on server.";
        setLogState({ status: "error", message });
        setIsOperationLoading(false);
      });
  };


  return (
    <>
      <GlobalStyle />
      {(isInitialLoading || isOperationLoading) && <LoadingOverlay />}
      {!isInitialLoading && (
        <Page>
          <Card>
          <Header>
            <LogoContainer>
              <img style={{ scale: '75%' }} src={'hex.png'} alt="HexTrust" />
              <Title>
                <h1>Payment Tracking</h1>
              </Title>
            </LogoContainer>
            <Badge>Expense Management</Badge>
          </Header>

          <Tabs style={{ marginTop: "24px" }} $activeIndex={mainTab === "create" ? 0 : 1}>
            <Tab
              type="button"
              $active={mainTab === "create"}
              onClick={() => setMainTab("create")}
            >
              Create Payment
            </Tab>
            <Tab
              type="button"
              $active={mainTab === "track"}
              onClick={() => setMainTab("track")}
            >
              Track Payment
            </Tab>
          </Tabs>

          {mainTab === "create" && (
            <TransactionForm
              type={type}
              spendingItems={spendingItems}
              submitState={submitState}
              statusTone={statusTone}
              register={register}
              control={control}
              errors={errors}
              amountValue={amountValue}
              trigger={trigger}
              onTypeChange={handleTypeChange}
              onSpendingItemChange={updateSpendingItem}
              onSpendingItemBlur={handleSpendingItemBlur}
              onAddSpendingItem={addSpendingItem}
              onRemoveSpendingItem={removeSpendingItem}
              onSubmit={onSubmit}
            />
          )}

          {mainTab === "track" && (
            <>
              <TotalDisplay refreshKey={totalDisplayRefreshKey} />

              <LogSection
                activeTab={activeTab}
                recentLogs={recentLogs}
                logs={logs}
                logState={logState}
                selectedItems={selectedItems}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onTabChange={(tab) => {
                  setActiveTab(tab);
                  setSelectedItems(new Set());
                  setPendingStatusChanges(new Map()); // Clear pending changes when switching tabs
                  if (tab === "recent" && !recentLogs) {
                    onFetchRecentItems();
                  }
                }}
                onFetchRecentItems={onFetchRecentItems}
                onFetchLogs={onFetchLogs}
                onDateFromChange={setDateFrom}
                onDateToChange={setDateTo}
                onSelectAll={selectAllItems}
                onClearSelection={clearSelection}
                onDeleteMultiple={onDeleteMultipleEntries}
                onToggleSelection={toggleItemSelection}
                onDeleteEntry={onDeleteEntry}
                onUpdateStatus={onStatusChange}
                onUpdateMultipleStatus={onUpdateMultipleStatus}
                pendingStatusChanges={pendingStatusChanges}
                onSubmitStatusChanges={onSubmitStatusChanges}
              />
            </>
          )}
          </Card>
        </Page>
      )}
      {showStatusModal && (
        <StatusUpdateModal
          changes={Array.from(pendingStatusChanges.entries()).map(([id, change]) => ({
            id,
            description: change.description,
            from: change.from,
            to: change.to,
          }))}
          onConfirm={onConfirmStatusChanges}
          onCancel={onCancelStatusChanges}
        />
      )}
    </>
  );
}

export default App;
