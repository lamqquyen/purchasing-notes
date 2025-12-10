import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import styled, { createGlobalStyle } from "styled-components";
import {
  deleteEntry,
  fetchLogsByDateRange,
  fetchRecentItems,
  fetchTotal,
  logEntry,
  type SheetLogResponse,
} from "./services/sheets";

type EntryType = "spending" | "receiving";

type FormValues = {
  occurredAt: string;
  amount: number;
  description: string;
};

type SpendingItem = {
  id: string;
  description: string;
  amount: number;
  amountError?: string;
  descriptionError?: string;
};

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: radial-gradient(circle at 20% 20%, #f7faff, #eef2ff 45%, #e6ecff);
    color: #0f172a;
    min-height: 100vh;
  }
`;

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
`;

const Card = styled.section`
  width: min(960px, 100%);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 20px 80px rgba(15, 23, 42, 0.1),
    0 4px 20px rgba(15, 23, 42, 0.04);
  padding: 32px;
  display: grid;
  gap: 24px;

  @media (max-width: 720px) {
    padding: 20px;
  }
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const Title = styled.div`
  display: grid;
  gap: 6px;

  h1 {
    margin: 0;
    font-size: clamp(24px, 3vw, 30px);
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #475569;
    font-size: 15px;
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 600;
  font-size: 14px;
`;

const Form = styled.form`
  display: grid;
  gap: 20px;
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: #1f2937;
`;

const Input = styled.input`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #0f172a;
  font-size: 15px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  }
`;

const SelectRow = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: 12px;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  gap: 6px;
  width: fit-content;
`;

const SelectButton = styled.button<{ $active: boolean }>`
  border: 0;
  background: ${({ $active }) => ($active ? "#111827" : "transparent")};
  color: ${({ $active }) => ($active ? "#ffffff" : "#0f172a")};
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? "#111827" : "#e5e7eb")};
  }
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
  
  &:hover {
    transform: translateY(-1px);
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const Status = styled.div<{ $tone: "success" | "error" | "muted" }>`
  padding: 12px 14px;
  border-radius: 12px;
  font-weight: 600;
  color: ${({ $tone }) =>
    $tone === "success"
      ? "#166534"
      : $tone === "error"
      ? "#991b1b"
      : "#475569"};
  background: ${({ $tone }) =>
    $tone === "success"
      ? "rgba(22, 101, 52, 0.1)"
      : $tone === "error"
      ? "rgba(153, 27, 27, 0.1)"
      : "#f8fafc"};
  border: 1px solid
    ${({ $tone }) =>
      $tone === "success"
        ? "rgba(22, 101, 52, 0.2)"
        : $tone === "error"
        ? "rgba(153, 27, 27, 0.2)"
        : "#e2e8f0"};
`;

const Helper = styled.span`
  font-size: 13px;
  margin-left: 12px;
  color: #64748b;
  display: block;
  margin-top: 4px;
  margin-left: 0;
`;

const LogSection = styled.section`
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
`;

const LogHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 16px;
`;

const Tab = styled.button<{ $active: boolean }>`
  border: 0;
  background: transparent;
  color: ${({ $active }) => ($active ? "#6366f1" : "#64748b")};
  padding: 12px 16px;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  font-size: 14px;
  cursor: pointer;
  border-bottom: 2px solid ${({ $active }) => ($active ? "#6366f1" : "transparent")};
  margin-bottom: -2px;
  transition: all 0.2s ease;

  &:hover {
    color: ${({ $active }) => ($active ? "#6366f1" : "#475569")};
  }
`;

const LogList = styled.div`
  display: grid;
  gap: 8px;
`;

const LogRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  color: #0f172a;
`;

const DeleteButton = styled.button`
  border: 0;
  background: #fee2e2;
  color: #991b1b;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: #fecaca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RemoveButton = styled.button`
  border: 0;
  background: #fee2e2;
  color: #991b1b;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-end;

  &:hover {
    background: #fecaca;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #6366f1;
`;

const SelectionControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid #e2e8f0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SelectionActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
`;

const LogRowContainer = styled.div`
  flex-direction: column;
  gap: 8px;
  display: flex;
  margin: 8px 0;
`;

const TotalDisplay = styled.div`
  padding: 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #ffffff;
  text-align: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
  }
  
  .amount {
    font-size: 32px;
    font-weight: 700;
    margin: 0;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const requiredMessage = "Trường này là bắt buộc";

function formatNumberWithPeriods(value: number | string): string {
  if (value === "" || value === null || value === undefined) return "";
  const numValue = typeof value === "string" ? parseFloat(value.replace(/\./g, "")) : value;
  if (isNaN(numValue)) return "";
  return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function sortLogsByDateDesc(logs: SheetLogResponse): SheetLogResponse {
  const parseDate = (dateStr: string): Date => {
    // Date format is dd/MM/yyyy
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    // Fallback: try to parse as-is
    return new Date(dateStr);
  };

  const sorted: SheetLogResponse = { ...logs };
  
  if (sorted.spending) {
    // Create array with original index to preserve creation order
    const spendingWithIndex = sorted.spending.map((item, index) => ({ item, originalIndex: index }));
    spendingWithIndex.sort((a, b) => {
      const dateA = parseDate(a.item.date);
      const dateB = parseDate(b.item.date);
      const dateDiff = dateB.getTime() - dateA.getTime(); // Descending (newest first)
      
      // If dates are the same, preserve original order (newer items appear first in original array)
      // Since backend returns newest first, we reverse the original index comparison
      if (dateDiff === 0) {
        return b.originalIndex - a.originalIndex; // Items that appeared later in original array come first
      }
      
      return dateDiff;
    });
    sorted.spending = spendingWithIndex.map(({ item }) => item);
  }
  
  if (sorted.receiving) {
    // Create array with original index to preserve creation order
    const receivingWithIndex = sorted.receiving.map((item, index) => ({ item, originalIndex: index }));
    receivingWithIndex.sort((a, b) => {
      const dateA = parseDate(a.item.date);
      const dateB = parseDate(b.item.date);
      const dateDiff = dateB.getTime() - dateA.getTime(); // Descending (newest first)
      
      // If dates are the same, preserve original order (newer items appear first in original array)
      // Since backend returns newest first, we reverse the original index comparison
      if (dateDiff === 0) {
        return b.originalIndex - a.originalIndex; // Items that appeared later in original array come first
      }
      
      return dateDiff;
    });
    sorted.receiving = receivingWithIndex.map(({ item }) => item);
  }
  
  return sorted;
}

function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  // If already in dd/MM/yyyy format, return as is
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateStr;
  }
  return dateStr;
}

function convertDDMMYYYYToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return "";
  // If already in YYYY-MM-DD format, return as is
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  // Convert from dd/MM/yyyy to yyyy-MM-dd
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function convertYYYYMMDDToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  // If already in dd/MM/yyyy format, return as is
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return dateStr;
  }
  // Convert from yyyy-MM-dd to dd/MM/yyyy
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getTodayVNT(): string {
  // Get current date in Vietnam timezone (Asia/Ho_Chi_Minh, UTC+7)
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  // Returns YYYY-MM-DD format
  return formatter.format(now);
}

function getTodayVNTFormatted(): string {
  return convertYYYYMMDDToDDMMYYYY(getTodayVNT());
}

function getDefaultDateRange() {
  const todayVNT = getTodayVNT();
  const todayParts = todayVNT.split('-');
  const todayDate = new Date(parseInt(todayParts[0]), parseInt(todayParts[1]) - 1, parseInt(todayParts[2]));
  const sevenDaysAgo = new Date(todayDate);
  sevenDaysAgo.setDate(todayDate.getDate() - 7);
  
  const year = sevenDaysAgo.getFullYear();
  const month = String(sevenDaysAgo.getMonth() + 1).padStart(2, '0');
  const day = String(sevenDaysAgo.getDate()).padStart(2, '0');
  const sevenDaysAgoVNT = `${year}-${month}-${day}`;
  
  return {
    from: sevenDaysAgoVNT,
    to: todayVNT,
  };
}

function App() {
  const [type, setType] = useState<EntryType>("spending");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });
  const [total, setTotal] = useState<number | null>(null);
  const defaultDateRange = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaultDateRange.from);
  const [dateTo, setDateTo] = useState(defaultDateRange.to);
  const [logs, setLogs] = useState<SheetLogResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<SheetLogResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"recent" | "filter">("recent");
  const [logState, setLogState] = useState<SubmitState>({ status: "idle" });
  const [lastSubmittedDate, setLastSubmittedDate] = useState<string | null>(null);
  const [spendingItems, setSpendingItems] = useState<SpendingItem[]>([
    { id: "1", description: "", amount: 0, amountError: undefined, descriptionError: undefined }
  ]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
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


  // Fetch total and recent items on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [totalValue, recentData] = await Promise.all([
          fetchTotal(),
          fetchRecentItems(10)
        ]);
        setTotal(totalValue);
        setRecentLogs(sortLogsByDateDesc(recentData));
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
      const data = await fetchRecentItems(10);
      setRecentLogs(sortLogsByDateDesc(data));
      setLogState({ status: "success", message: "Đã tải dữ liệu." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu.";
      setLogState({ status: "error", message });
    }
  };

  const statusTone = useMemo(() => {
    if (submitState.status === "success") return "success";
    if (submitState.status === "error") return "error";
    return "muted";
  }, [submitState.status]);

  const addSpendingItem = () => {
    setSpendingItems([...spendingItems, { id: Date.now().toString(), description: "", amount: 0, amountError: undefined, descriptionError: undefined }]);
  };

  const removeSpendingItem = (id: string) => {
    if (spendingItems.length > 1) {
      setSpendingItems(spendingItems.filter(item => item.id !== id));
    }
  };

  const updateSpendingItem = (id: string, field: "description" | "amount", value: string | number) => {
    setSpendingItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        // Don't validate on change, only update the value
        // Validation will happen on blur
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const onSubmit = handleSubmit(async (data) => {
    // For receiving type, ensure validation is triggered
    if (type === "receiving") {
      // Trigger validation for all fields
      const isValid = await trigger();
      if (!isValid) {
        // Validation failed, errors will be shown by react-hook-form
        return;
      }
    }
    
    // Convert date from dd/MM/yyyy to yyyy-MM-dd for API (needed for both types)
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
          updated.amountError = "Giá trị phải lớn hơn 0";
          hasErrors = true;
        } else {
          updated.amountError = undefined;
        }
        return updated;
      });
      
      // Update state with errors so they display in UI
      setSpendingItems(updatedItems);
      
      if (hasErrors) {
        setSubmitState({ status: "error", message: "Vui lòng kiểm tra lại các trường đã nhập." });
        return;
      }
      
      const validItems = spendingItems.filter(item => item.description.trim() && item.amount > 0);
      if (validItems.length === 0) {
        setSubmitState({ status: "error", message: "Vui lòng nhập ít nhất một mục chi tiêu hợp lệ." });
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
          })
        )
      )
        .then(async () => {
          // Refresh both recentLogs and total
          try {
            const [recentData, totalValue] = await Promise.all([
              fetchRecentItems(10),
              fetchTotal()
            ]);
            setRecentLogs(sortLogsByDateDesc(recentData));
            setTotal(totalValue);
          } catch (e) {
            console.error("Failed to refresh data:", e);
          } finally {
            setIsOperationLoading(false);
          }
          
          setSubmitState({
            status: "success",
            message: `Lưu thành công ${validItems.length} mục!`,
          });
          
          // Keep the date for "add more" functionality
          setLastSubmittedDate(currentDate);
          
          // Reset form
          setSpendingItems([{ id: Date.now().toString(), description: "", amount: 0, amountError: undefined, descriptionError: undefined }]);
          
          // Switch to recent tab
          setActiveTab("recent");
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Hiện chưa thể ghi giao dịch.";
          setSubmitState({ status: "error", message });
          setIsOperationLoading(false);
        });
    } else {
      // Receiving item - react-hook-form already validated via handleSubmit
      setSubmitState({ status: "submitting" });
      setIsOperationLoading(true);
      
      // Call API
      logEntry({
        ...data,
        occurredAt: dateForAPI,
        type,
      })
        .then(async () => {
          // Refresh both recentLogs and total
          try {
            const [recentData, totalValue] = await Promise.all([
              fetchRecentItems(10),
              fetchTotal()
            ]);
            setRecentLogs(sortLogsByDateDesc(recentData));
            setTotal(totalValue);
          } catch (e) {
            console.error("Failed to refresh data:", e);
          } finally {
            setIsOperationLoading(false);
          }
          
          setSubmitState({
            status: "success",
            message: `Lưu thành công 1 mục!`,
          });
          
          // Keep the date for "add more" functionality
          setLastSubmittedDate(currentDate);
          
          // Reset form
          reset({
            amount: 0,
            description: "",
            occurredAt: currentDate,
          });
          resetField("amount", { defaultValue: 0 });
          
          // Switch to recent tab
          setActiveTab("recent");
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : "Hiện chưa thể ghi giao dịch.";
          setSubmitState({ status: "error", message });
          setIsOperationLoading(false);
        });
    }
  });

  const onFetchLogs = async () => {
    if (!dateFrom || !dateTo) {
      setLogState({ status: "error", message: "Chọn khoảng ngày cần tra cứu." });
      return;
    }
    if (dateFrom > dateTo) {
      setLogState({ status: "error", message: "Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc." });
      return;
    }
    setLogState({ status: "submitting" });
    try {
      const data = await fetchLogsByDateRange(dateFrom, dateTo);
      setLogs(sortLogsByDateDesc(data));
      setLogState({ status: "success", message: "Đã tải dữ liệu." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu.";
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
      recentLogs.receiving?.forEach(item => allItems.add(`receiving:${item.id}`));
    } else if (activeTab === "filter" && logs) {
      logs.spending?.forEach(item => allItems.add(`spending:${item.id}`));
      logs.receiving?.forEach(item => allItems.add(`receiving:${item.id}`));
    }
    setSelectedItems(allItems);
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const onDeleteMultipleEntries = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedItems.size} bản ghi đã chọn?`)) return;

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
        // Refresh both recentLogs and total, and filter tab logs if needed
        try {
          const promises: Promise<any>[] = [fetchTotal()];
          
          if (activeTab === "recent") {
            promises.push(fetchRecentItems(10));
          } else if (activeTab === "filter" && dateFrom && dateTo) {
            promises.push(fetchLogsByDateRange(dateFrom, dateTo));
          }
          
          const results = await Promise.all(promises);
          setTotal(results[0]);
          
          if (activeTab === "recent" && results[1]) {
            setRecentLogs(sortLogsByDateDesc(results[1]));
          } else if (activeTab === "filter" && results[1]) {
            setLogs(sortLogsByDateDesc(results[1]));
          }
        } catch (e) {
          console.error("Failed to refresh data:", e);
        } finally {
          setIsOperationLoading(false);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Không thể xóa bản ghi trên server.";
        setLogState({ status: "error", message });
        setIsOperationLoading(false);
      });
  };

  const onDeleteEntry = async (id: string, entryType: EntryType) => {
    if (!confirm("Bạn có chắc muốn xóa bản ghi này?")) return;
    
    // Show loading overlay
    setIsOperationLoading(true);
    
    // Call backend
    deleteEntry(id, entryType)
      .then(async () => {
        // Refresh both recentLogs and total, and filter tab logs if needed
        try {
          const promises: Promise<any>[] = [fetchTotal()];
          
          if (activeTab === "recent") {
            promises.push(fetchRecentItems(10));
          } else if (activeTab === "filter" && dateFrom && dateTo) {
            promises.push(fetchLogsByDateRange(dateFrom, dateTo));
          }
          
          const results = await Promise.all(promises);
          setTotal(results[0]);
          
          if (activeTab === "recent" && results[1]) {
            setRecentLogs(sortLogsByDateDesc(results[1]));
          } else if (activeTab === "filter" && results[1]) {
            setLogs(sortLogsByDateDesc(results[1]));
          }
        } catch (e) {
          console.error("Failed to refresh data:", e);
        } finally {
          setIsOperationLoading(false);
        }
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Không thể xóa bản ghi trên server.";
        setLogState({ status: "error", message });
        setIsOperationLoading(false);
      });
  };


  return (
    <>
      <GlobalStyle />
      {(isInitialLoading || isOperationLoading) && (
        <LoadingOverlay>
          <Spinner />
        </LoadingOverlay>
      )}
      {!isInitialLoading && (
        <Page>
          <Card>
          <Header>
            <Title>
              <h1>Sổ Ghi Tiền</h1>
            </Title>
            <Badge>Quản Lý Chi Tiêu</Badge>
          </Header>

          {total !== null && (
            <TotalDisplay>
              <h2>Tổng còn lại</h2>
              <p className="amount">{total.toLocaleString("vi-VN")} đ</p>
            </TotalDisplay>
          )}

          <Form onSubmit={onSubmit} noValidate>
            <Field>
              Loại giao dịch
              <SelectRow>
                <SelectButton
                  type="button"
                  onClick={() => {
                    setType("spending");
                    setSpendingItems([{ id: Date.now().toString(), description: "", amount: 0, amountError: undefined, descriptionError: undefined }]);
                  }}
                  $active={type === "spending"}
                >
                  Chi tiền
                </SelectButton>
                <SelectButton
                  type="button"
                  onClick={() => {
                    setType("receiving");
                    setSpendingItems([{ id: Date.now().toString(), description: "", amount: 0, amountError: undefined, descriptionError: undefined }]);
                  }}
                  $active={type === "receiving"}
                >
                  Nhận tiền
                </SelectButton>
              </SelectRow>
              <Helper>Chọn loại nhãn cho khoản này.</Helper>
            </Field>

            <Field>
              Ngày
              <Input
                type="date"
                {...register("occurredAt", { 
                  required: requiredMessage
                })}
              />
              {errors.occurredAt && (
                <Helper>{errors.occurredAt.message}</Helper>
              )}
            </Field>

            {type === "spending" ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {spendingItems.map((item, index) => (
                  <ItemRow key={item.id}>
                    <div style={{ display: "grid", gap: "8px" }}>
                      <Field>
                        Dùng cho việc gì?
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateSpendingItem(item.id, "description", e.target.value)}
                          onBlur={() => {
                            // Validate description on blur
                            setSpendingItems(prevItems => prevItems.map(i => {
                              if (i.id === item.id) {
                                if (!i.description.trim()) {
                                  return { ...i, descriptionError: requiredMessage };
                                } else {
                                  return { ...i, descriptionError: undefined };
                                }
                              }
                              return i;
                            }));
                          }}
                          placeholder="Mô tả chi tiêu"
                        />
                        {item.descriptionError && (
                          <Helper style={{ color: "#dc2626", marginTop: "4px", display: "block" }}>
                            {item.descriptionError}
                          </Helper>
                        )}
                      </Field>
                      <Field>
                        Số tiền
                        <Input
                          type="text"
                          placeholder="0"
                          value={formatNumberWithPeriods(item.amount)}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // If input is empty, set to 0 and show error
                            if (inputValue === "" || inputValue.trim() === "") {
                              updateSpendingItem(item.id, "amount", 0);
                            } else {
                              const parsed = parseFormattedNumber(inputValue);
                              updateSpendingItem(item.id, "amount", parsed);
                            }
                          }}
                          onBlur={() => {
                            // Validate on blur using functional update
                            const numValue = item.amount;
                            setSpendingItems(prevItems => prevItems.map(i => {
                              if (i.id === item.id) {
                                if (!numValue || numValue <= 0 || isNaN(numValue)) {
                                  return { ...i, amountError: "Giá trị phải lớn hơn 0" };
                                } else {
                                  return { ...i, amountError: undefined };
                                }
                              }
                              return i;
                            }));
                          }}
                        />
                        {item.amountError && (
                          <Helper style={{ color: "#dc2626", marginTop: "4px", display: "block" }}>
                            {item.amountError}
                          </Helper>
                        )}
                      </Field>
                    </div>
                    {spendingItems.length > 1 && (
                      <RemoveButton
                        type="button"
                        onClick={() => removeSpendingItem(item.id)}
                      >
                        Xóa
                      </RemoveButton>
                    )}
                  </ItemRow>
                ))}
                <Button
                  type="button"
                  onClick={addSpendingItem}
                  style={{ background: "#e0e7ff", color: "#4338ca" }}
                >
                  + Thêm mục
                </Button>
              </div>
            ) : (
              <Field>
                Số tiền
                <Controller
                  name="amount"
                  control={control}
                  rules={{
                    required: requiredMessage,
                    validate: (value) => {
                      const numValue = typeof value === "number" ? value : parseFloat(value);
                      if (!numValue || numValue <= 0) {
                        return "Giá trị phải lớn hơn 0";
                      }
                      return true;
                    }
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        type="text"
                        placeholder="0"
                        value={formatNumberWithPeriods(field.value || 0)}
                        onChange={(e) => {
                          const parsed = parseFormattedNumber(e.target.value);
                          field.onChange(parsed);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          // Trigger validation on blur
                          trigger("amount");
                        }}
                      />
                      {(fieldState.error || errors.amount) && (
                        <Helper style={{ color: "#dc2626", marginTop: "4px", display: "block" }}>
                          {fieldState.error?.message || errors.amount?.message}
                        </Helper>
                      )}
                    </>
                  )}
                />
              </Field>
            )}

            <Actions>
              <Button
                type="submit"
                disabled={submitState.status === "submitting"}
              >
                {submitState.status === "submitting"
                  ? "Đang lưu…"
                  : "Lưu"}
              </Button>
            </Actions>
          </Form>

          {submitState.status !== "idle" && <Status $tone={statusTone}>
            {submitState.status === "submitting" &&
              "Đang gửi lên Google Sheets…"}
            {submitState.status === "success" && submitState.message}
            {submitState.status === "error" && submitState.message}
          </Status>}


          <LogSection>
            <Tabs>
              <Tab
                type="button"
                $active={activeTab === "recent"}
                onClick={() => {
                  setActiveTab("recent");
                  setSelectedItems(new Set());
                  if (!recentLogs) {
                    onFetchRecentItems();
                  }
                }}
              >
                Bản ghi gần đây
              </Tab>
              <Tab
                type="button"
                $active={activeTab === "filter"}
                onClick={() => {
                  setActiveTab("filter");
                  setSelectedItems(new Set());
                }}
              >
                Lọc theo ngày
              </Tab>
            </Tabs>

            {activeTab === "recent" && (
              <>
                <LogHeader>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
                    Top 10 bản ghi gần đây
                  </h3>
                  <Button
                    type="button"
                    onClick={onFetchRecentItems}
                    disabled={logState.status === "submitting"}
                  >
                    {logState.status === "submitting" ? "Đang tải…" : "Làm mới"}
                  </Button>
                </LogHeader>

                {logState.status === "error" && <Helper>{logState.message}</Helper>}
                {logState.status === "success" && (
                  <Helper>{logState.message}</Helper>
                )}

                {recentLogs && logState.status !== "submitting" && (
                  <>
                    {(recentLogs.spending?.length || recentLogs.receiving?.length) && (
                      <SelectionControls>
                        <span style={{ fontSize: 14, color: "#64748b" }}>
                          {selectedItems.size > 0 ? `Đã chọn ${selectedItems.size} mục` : "Chọn nhiều mục để xóa"}
                        </span>
                        <SelectionActions>
                          <Button
                            type="button"
                            onClick={selectAllItems}
                            style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 12, padding: "6px 12px", flex: 1 }}
                          >
                            Chọn tất cả
                          </Button>
                          {selectedItems.size > 0 && (
                            <>
                              <Button
                                type="button"
                                onClick={clearSelection}
                                style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "6px 12px", flex: 1 }}
                              >
                                Bỏ chọn
                              </Button>
                              <DeleteButton
                                type="button"
                                onClick={onDeleteMultipleEntries}
                                style={{flex: 1}}
                              >
                                Xóa {selectedItems.size} mục
                              </DeleteButton>
                            </>
                          )}
                        </SelectionActions>
                      </SelectionControls>
                    )}
                    <LogList>
                      <div>
                        <strong>Chi tiền</strong>
                        {recentLogs.spending?.length ? (
                          <LogRowContainer>
                            {recentLogs.spending.map((item, idx) => (
                              <LogRow key={`sp-${item.id || idx}`}>
                                <Checkbox
                                  type="checkbox"
                                  checked={selectedItems.has(`spending:${item.id}`)}
                                  onChange={() => toggleItemSelection(item.id, "spending")}
                                />
                                <span style={{flex: 1}}>{formatDateDDMMYYYY(item.date)}</span>
                                <span style={{flex: 3}}>{item.description || "—"}</span>
                                <strong style={{flex: 1, display:'flex', justifyContent: 'flex-end'}}>{item.amount.toLocaleString("vi-VN")}</strong>
                                <DeleteButton
                                  type="button"
                                  onClick={() => onDeleteEntry(item.id, "spending")}
                                >
                                  Xóa
                                </DeleteButton>
                              </LogRow>
                            ))}
                          </LogRowContainer>
                        ) : (
                          <Helper>Không có bản ghi chi tiêu.</Helper>
                        )}
                      </div>
                      <div>
                        <strong>Nhận tiền</strong>
                        {recentLogs.receiving?.length ? (
                          <LogRowContainer>
                            {recentLogs.receiving.map((item, idx) => (
                              <LogRow key={`rc-${item.id || idx}`}>
                                <Checkbox
                                  type="checkbox"
                                  checked={selectedItems.has(`receiving:${item.id}`)}
                                  onChange={() => toggleItemSelection(item.id, "receiving")}
                                />
                                <span style={{flex: 1}}>{formatDateDDMMYYYY(item.date)}</span>
                                <strong style={{flex: 1, display:'flex', justifyContent: 'flex-end'}}>{item.amount.toLocaleString("vi-VN")}</strong>
                                <DeleteButton
                                  type="button"
                                  onClick={() => onDeleteEntry(item.id, "receiving")}
                                >
                                  Xóa
                                </DeleteButton>
                              </LogRow>
                            ))}
                          </LogRowContainer>
                        ) : (
                          <Helper>Không có bản ghi nhận tiền.</Helper>
                        )}
                      </div>
                    </LogList>
                  </>
                )}
              </>
            )}

            {activeTab === "filter" && (
              <>
                <LogHeader>
                  <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
                    Tra cứu theo ngày
                  </h3>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span style={{ color: "#64748b", textAlign: 'center' }}>đến</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={onFetchLogs}
                    disabled={logState.status === "submitting"}
                  >
                    {logState.status === "submitting" ? "Đang tải…" : "Tra cứu"}
                  </Button>
                </LogHeader>

                {logState.status === "error" && <Helper>{logState.message}</Helper>}
                {logState.status === "success" && (
                  <Helper>{logState.message}</Helper>
                )}

                {logs && logState.status !== "submitting" && (
                  <>
                    {(logs.spending?.length || logs.receiving?.length) && (
                      <SelectionControls>
                        <span style={{ fontSize: 14, color: "#64748b" }}>
                          {selectedItems.size > 0 ? `Đã chọn ${selectedItems.size} mục` : "Chọn nhiều mục để xóa"}
                        </span>
                        <SelectionActions>
                          <Button
                            type="button"
                            onClick={selectAllItems}
                            style={{ background: "#e0e7ff", color: "#4338ca", fontSize: 12, padding: "6px 12px" }}
                          >
                            Chọn tất cả
                          </Button>
                          {selectedItems.size > 0 && (
                            <>
                              <Button
                                type="button"
                                onClick={clearSelection}
                                style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, padding: "6px 12px" }}
                              >
                                Bỏ chọn
                              </Button>
                              <DeleteButton
                                type="button"
                                onClick={onDeleteMultipleEntries}
                              >
                                Xóa {selectedItems.size} mục
                              </DeleteButton>
                            </>
                          )}
                        </SelectionActions>
                      </SelectionControls>
                    )}
                    <LogList>
                      <div>
                        <strong>Chi tiền</strong>
                        {logs.spending?.length ? (
                          <LogRowContainer>
                            {logs.spending.map((item, idx) => (
                              <LogRow key={`sp-${item.id || idx}`}>
                                <Checkbox
                                  type="checkbox"
                                  checked={selectedItems.has(`spending:${item.id}`)}
                                  onChange={() => toggleItemSelection(item.id, "spending")}
                                />
                                <span>{formatDateDDMMYYYY(item.date)}</span>
                                <span>{item.description || "—"}</span>
                                <strong>{item.amount.toLocaleString("vi-VN")}</strong>
                                <DeleteButton
                                  type="button"
                                  onClick={() => onDeleteEntry(item.id, "spending")}
                                >
                                  Xóa
                                </DeleteButton>
                              </LogRow>
                            ))}
                          </LogRowContainer>
                        ) : (
                          <Helper>Không có bản ghi chi tiêu.</Helper>
                        )}
                      </div>
                      <div>
                        <strong>Nhận tiền</strong>
                        {logs.receiving?.length ? (
                          <LogRowContainer>
                            {logs.receiving.map((item, idx) => (
                              <LogRow key={`rc-${item.id || idx}`}>
                                <Checkbox
                                  type="checkbox"
                                  checked={selectedItems.has(`receiving:${item.id}`)}
                                  onChange={() => toggleItemSelection(item.id, "receiving")}
                                />
                                <span>{formatDateDDMMYYYY(item.date)}</span>
                                <strong>{item.amount.toLocaleString("vi-VN")}</strong>
                                <DeleteButton
                                  type="button"
                                  onClick={() => onDeleteEntry(item.id, "receiving")}
                                >
                                  Xóa
                                </DeleteButton>
                              </LogRow>
                            ))}
                          </LogRowContainer>
                        ) : (
                          <Helper>Không có bản ghi nhận tiền.</Helper>
                        )}
                      </div>
                    </LogList>
                  </>
                )}
              </>
            )}
          </LogSection>
          </Card>
        </Page>
      )}
    </>
  );
}

export default App;
