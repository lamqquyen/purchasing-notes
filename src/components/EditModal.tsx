import { useState, useEffect } from "react";
import { Button, Field, Input, SelectRow, SelectButton, Helper } from "../styles";
import type { EntryType, SpendingStatus } from "../types";
import { formatNumberWithPeriods, parseFormattedNumber, convertDDMMYYYYToYYYYMMDD } from "../utils";
import type { SheetLogItem, VatLogItem } from "../services/sheets";

interface EditModalProps {
  item: SheetLogItem | VatLogItem;
  entryType: EntryType;
  onSave: (data: { occurredAt: string; amount: number; description?: string; status?: SpendingStatus }) => Promise<void>;
  onCancel: () => void;
}

export function EditModal({ item, entryType, onSave, onCancel }: EditModalProps) {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<SpendingStatus>("spent");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Convert date from dd/MM/yyyy to yyyy-MM-dd for input
    const dateParts = item.date.split("/");
    if (dateParts.length === 3) {
      setDate(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
    } else {
      setDate(item.date);
    }
    setAmount(item.amount || 0);
    if (entryType === "spending" && "description" in item) {
      setDescription(item.description || "");
      setStatus((item.status || "spent") as SpendingStatus);
    }
  }, [item, entryType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Date is required");
      return;
    }

    if (!amount || amount <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    if (entryType === "spending" && !description.trim()) {
      setError("Description is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const dateForAPI = convertDDMMYYYYToYYYYMMDD(date);
      await onSave({
        occurredAt: dateForAPI,
        amount,
        ...(entryType === "spending" ? { description: description.trim(), status } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update record");
      setIsSubmitting(false);
    }
  };

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
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 20px 80px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 20px 0", color: "#213560", fontSize: "20px" }}>
          Edit {entryType === "spending" ? "Payment" : "VAT Collected"} Record
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <Field>
            Date
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>

          {entryType === "spending" && (
            <Field>
              Description
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expense description"
                required
              />
            </Field>
          )}

          <Field>
            Amount
            <Input
              type="text"
              placeholder="0"
              value={formatNumberWithPeriods(amount)}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (inputValue === "" || inputValue.trim() === "") {
                  setAmount(0);
                } else {
                  const parsed = parseFormattedNumber(inputValue);
                  setAmount(parsed);
                }
              }}
              required
            />
          </Field>

          {entryType === "spending" && (
            <Field>
              Status
              <SelectRow>
                <SelectButton
                  type="button"
                  onClick={() => setStatus("spent")}
                  $active={status === "spent"}
                >
                  Spent
                </SelectButton>
                <SelectButton
                  type="button"
                  onClick={() => setStatus("requested")}
                  $active={status === "requested"}
                >
                  Requested
                </SelectButton>
                <SelectButton
                  type="button"
                  onClick={() => setStatus("claimed")}
                  $active={status === "claimed"}
                >
                  Claimed
                </SelectButton>
              </SelectRow>
            </Field>
          )}

          {error && <Helper style={{ color: "#dc2626" }}>{error}</Helper>}

          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
            <Button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                background: "#f1f5f9",
                color: "#64748b",
                flex: 1,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
