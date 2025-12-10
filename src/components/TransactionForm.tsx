import { Controller } from "react-hook-form";
import type { Control, FieldErrors, UseFormRegister, UseFormReset, UseFormResetField, UseFormSetValue, UseFormTrigger, UseFormWatch } from "react-hook-form";
import type { EntryType, FormValues, SpendingItem, SubmitState } from "../types";
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
  onSpendingItemChange: (id: string, field: "description" | "amount", value: string | number) => void;
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
          Loại giao dịch
          <SelectRow>
            <SelectButton
              type="button"
              onClick={() => onTypeChange("spending")}
              $active={type === "spending"}
            >
              Chi tiền
            </SelectButton>
            <SelectButton
              type="button"
              onClick={() => onTypeChange("receiving")}
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
            {spendingItems.map((item) => (
              <ItemRow key={item.id}>
                <div style={{ display: "grid", gap: "8px" }}>
                  <Field>
                    Dùng cho việc gì?
                    <Input
                      type="text"
                      value={item.description}
                      onChange={(e) => onSpendingItemChange(item.id, "description", e.target.value)}
                      onBlur={() => {
                        const value = item.description;
                        onSpendingItemBlur(item.id, "description", value);
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
                </div>
                {spendingItems.length > 1 && (
                  <RemoveButton
                    type="button"
                    onClick={() => onRemoveSpendingItem(item.id)}
                  >
                    Xóa
                  </RemoveButton>
                )}
              </ItemRow>
            ))}
            <Button
              type="button"
              onClick={onAddSpendingItem}
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

      {submitState.status !== "idle" && (
        <Status $tone={statusTone}>
          {submitState.status === "submitting" &&
            "Đang gửi lên Google Sheets…"}
          {submitState.status === "success" && submitState.message}
          {submitState.status === "error" && submitState.message}
        </Status>
      )}
    </>
  );
}
