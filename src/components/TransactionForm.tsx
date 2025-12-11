import { Controller } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister, UseFormReset, UseFormResetField, UseFormSetValue, UseFormTrigger, UseFormWatch } from "react-hook-form";
import type { EntryType, FormValues, SpendingItem, SpendingStatus, SubmitState } from "../types";
import { formatNumberWithPeriods, parseFormattedNumber, requiredMessage } from "../utils";
import {
  Form,
  Field,
  Input,
  SelectRow,
  SelectButton,
  Helper,
  Actions,
  Button,
  Status,
  ItemRow,
  RemoveButton,
} from "../styles";

interface TransactionFormProps {
  type: EntryType;
  spendingItems: SpendingItem[];
  submitState: SubmitState;
  statusTone: "success" | "error" | "muted";
  register: UseFormRegister<FormValues>;
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  amountValue: number;
  trigger: UseFormTrigger<FormValues>;
  onTypeChange: (type: EntryType) => void;
  onSpendingItemChange: (id: string, field: "description" | "amount" | "status", value: string | number | SpendingStatus) => void;
  onSpendingItemBlur: (id: string, field: "description" | "amount", value: string | number) => void;
  onAddSpendingItem: () => void;
  onRemoveSpendingItem: (id: string) => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
}

export function TransactionForm({
  type,
  spendingItems,
  submitState,
  statusTone,
  register,
  control,
  errors,
  amountValue,
  trigger,
  onTypeChange,
  onSpendingItemChange,
  onSpendingItemBlur,
  onAddSpendingItem,
  onRemoveSpendingItem,
  onSubmit,
}: TransactionFormProps) {
  return (
    <>
      <Form onSubmit={onSubmit} noValidate>
        <Field>
          Date
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

        <div style={{ display: "grid", gap: "12px" }}>
          {spendingItems.map((item) => (
            <ItemRow key={item.id}>
              <div style={{ display: "grid", gap: "8px" }}>
                <Field>
                  What is this for?
                  <Input
                    type="text"
                    value={item.description}
                    onChange={(e) => onSpendingItemChange(item.id, "description", e.target.value)}
                    onBlur={() => {
                      const value = item.description;
                      onSpendingItemBlur(item.id, "description", value);
                    }}
                    placeholder="Expense description"
                  />
                  {item.descriptionError && (
                    <Helper style={{ color: "#dc2626", marginTop: "4px", display: "block" }}>
                      {item.descriptionError}
                    </Helper>
                  )}
                </Field>
                <Field>
                  Amount
                  <Input
                    type="text"
                    placeholder="0"
                    value={formatNumberWithPeriods(item.amount)}
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      if (inputValue === "" || inputValue.trim() === "") {
                        onSpendingItemChange(item.id, "amount", 0);
                      } else {
                        const parsed = parseFormattedNumber(inputValue);
                        onSpendingItemChange(item.id, "amount", parsed);
                      }
                    }}
                    onBlur={() => {
                      const value = item.amount;
                      onSpendingItemBlur(item.id, "amount", value);
                    }}
                  />
                  {item.amountError && (
                    <Helper style={{ color: "#dc2626", marginTop: "4px", display: "block" }}>
                      {item.amountError}
                    </Helper>
                  )}
                </Field>
                <Field>
                  Status
                  <SelectRow>
                    <SelectButton
                      type="button"
                      onClick={() => onSpendingItemChange(item.id, "status", "spent")}
                      $active={item.status === "spent"}
                    >
                      Spent
                    </SelectButton>
                    <SelectButton
                      type="button"
                      onClick={() => onSpendingItemChange(item.id, "status", "requested")}
                      $active={item.status === "requested"}
                    >
                      Requested
                    </SelectButton>
                    <SelectButton
                      type="button"
                      onClick={() => onSpendingItemChange(item.id, "status", "claimed")}
                      $active={item.status === "claimed"}
                    >
                      Claimed
                    </SelectButton>
                  </SelectRow>
                </Field>
              </div>
              {spendingItems.length > 1 && (
                <RemoveButton
                  type="button"
                  onClick={() => onRemoveSpendingItem(item.id)}
                >
                  Remove
                </RemoveButton>
              )}
            </ItemRow>
          ))}
          <Button
            type="button"
            onClick={onAddSpendingItem}
            style={{ background: "rgba(33, 53, 96, 0.1)", color: "#213560" }}
          >
            + Add Item
          </Button>
        </div>

        <Actions>
          <Button
            type="submit"
            disabled={submitState.status === "submitting"}
          >
            {submitState.status === "submitting"
              ? "Saving…"
              : "Save"}
          </Button>
        </Actions>
      </Form>

      {submitState.status !== "idle" && (
        <Status $tone={statusTone}>
          {submitState.status === "submitting" &&
            "Sending to Google Sheets…"}
          {submitState.status === "success" && submitState.message}
          {submitState.status === "error" && submitState.message}
        </Status>
      )}
    </>
  );
}
