import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import styled, { createGlobalStyle } from "styled-components";
import {
  deleteEntry,
  fetchLogsByDate,
  logEntry,
  type SheetLogResponse,
} from "./services/sheets";

type EntryType = "spending" | "receiving";

type FormValues = {
  occurredAt: string;
  amount: number;
  description: string;
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
  box-shadow: 0 12px 30px rgba(99, 102, 241, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 36px rgba(99, 102, 241, 0.45);
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
`;

const LogSection = styled.section`
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
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

  &:hover {
    background: #fecaca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LogRowContainer = styled.div`
  flex-direction: column;
  gap: 8px;
  display: flex;
`;

const requiredMessage = "Trường này là bắt buộc";

function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function App() {
  const [type, setType] = useState<EntryType>("spending");
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });
  const [logDate, setLogDate] = useState("");
  const [logs, setLogs] = useState<SheetLogResponse | null>(null);
  const [logState, setLogState] = useState<SubmitState>({ status: "idle" });
  const {
    register,
    handleSubmit,
    reset,
    resetField,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      amount: undefined,
      description: "",
      occurredAt: "",
    },
    shouldUnregister: true,
  });

  const statusTone = useMemo(() => {
    if (submitState.status === "success") return "success";
    if (submitState.status === "error") return "error";
    return "muted";
  }, [submitState.status]);

  const onSubmit = handleSubmit(async (data) => {
    setSubmitState({ status: "submitting" });
    try {
      await logEntry({
        ...data,
        type,
      });
      setSubmitState({
        status: "success",
        message: "Đã lưu lên Google Sheets!",
      });
      reset({
        description: "",
        occurredAt: "",
      });
      // Explicitly clear amount field for number input
      resetField("amount", { defaultValue: undefined });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Hiện chưa thể ghi giao dịch.";
      setSubmitState({ status: "error", message });
    }
  });

  const onFetchLogs = async () => {
    if (!logDate) {
      setLogState({ status: "error", message: "Chọn ngày cần xem." });
      return;
    }
    setLogState({ status: "submitting" });
    try {
      const data = await fetchLogsByDate(logDate);
      setLogs(data);
      setLogState({ status: "success", message: "Đã tải dữ liệu." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể tải dữ liệu.";
      setLogState({ status: "error", message });
    }
  };

  const onDeleteEntry = async (id: string, entryType: EntryType) => {
    if (!confirm("Bạn có chắc muốn xóa bản ghi này?")) return;
    setLogState({ status: "submitting" });
    try {
      await deleteEntry(id, entryType);
      if (logDate) {
        const data = await fetchLogsByDate(logDate);
        setLogs(data);
      }
      setLogState({ status: "success", message: "Đã xóa bản ghi." });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể xóa bản ghi.";
      setLogState({ status: "error", message });
    }
  };

  return (
    <>
      <GlobalStyle />
      <Page>
        <Card>
          <Header>
            <Title>
              <h1>Sổ Ghi Tiền</h1>
              <p>Theo dõi chi tiêu và thu vào, lưu thẳng lên Google Sheets.</p>
            </Title>
            <Badge>Quản Lý Chi Tiêu</Badge>
          </Header>

          <Form onSubmit={onSubmit} noValidate>
            <Field>
              Loại giao dịch
              <SelectRow>
                <SelectButton
                  type="button"
                  onClick={() => setType("spending")}
                  $active={type === "spending"}
                >
                  Chi tiền
                </SelectButton>
                <SelectButton
                  type="button"
                  onClick={() => setType("receiving")}
                  $active={type === "receiving"}
                >
                  Nhận tiền
                </SelectButton>
              </SelectRow>
              <Helper>Chọn loại nhãn cho khoản này.</Helper>
            </Field>

            <Grid>
              <Field>
                Ngày
                <Input
                  type="date"
                  {...register("occurredAt", { required: requiredMessage })}
                />
                {errors.occurredAt && (
                  <Helper>{errors.occurredAt.message}</Helper>
                )}
              </Field>

              <Field>
                Số tiền
                <Input
                  type="number"
                  step="1000"
                  min="1000"
                  placeholder="0"
                  {...register("amount", {
                    required: requiredMessage,
                    valueAsNumber: true,
                    min: { value: 1, message: "Giá trị phải lớn hơn 0" },
                  })}
                />
                {errors.amount && <Helper>{errors.amount.message}</Helper>}
              </Field>
            </Grid>

            {type === "spending" && (
              <Field>
                Dùng tiền cho việc gì?
                <Input
                  type="text"
                  {...register("description", {
                    required: requiredMessage,
                    minLength: { value: 2, message: requiredMessage },
                  })}
                />
                {errors.description && (
                  <Helper>{errors.description.message}</Helper>
                )}
              </Field>
            )}

            <Actions>
              <Button
                type="submit"
                disabled={submitState.status === "submitting"}
              >
                {submitState.status === "submitting"
                  ? "Đang lưu…"
                  : "Lưu lên Sheet"}
              </Button>
              <Helper>
                Dữ liệu được gửi an toàn tới Google Apps Script / Sheets của
                bạn.
              </Helper>
            </Actions>
          </Form>

          <Status $tone={statusTone}>
            {submitState.status === "idle" && "Sẵn sàng ghi giao dịch mới."}
            {submitState.status === "submitting" &&
              "Đang gửi lên Google Sheets…"}
            {submitState.status === "success" && submitState.message}
            {submitState.status === "error" && submitState.message}
          </Status>

          <LogSection>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>
                Tra cứu theo ngày
              </h3>
              <Input
                type="date"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                style={{ maxWidth: 200 }}
              />
              <Button
                type="button"
                onClick={onFetchLogs}
                disabled={logState.status === "submitting"}
              >
                {logState.status === "submitting" ? "Đang tải…" : "Tra cứu"}
              </Button>
            </div>

            {logState.status === "error" && <Helper>{logState.message}</Helper>}
            {logState.status === "success" && (
              <Helper>{logState.message}</Helper>
            )}

            {logs && logState.status !== "submitting" && (
              <LogList>
                {typeof logs.total === "number" && (
                  <LogRow>
                    <span>Tổng còn lại</span>
                    <strong>{logs.total.toLocaleString("vi-VN")}</strong>
                  </LogRow>
                )}
                <div>
                  <strong>Chi tiền</strong>
                  {logs.spending?.length ? (
                    <LogRowContainer>
                      {logs.spending.map((item, idx) => (
                        <LogRow key={`sp-${item.id || idx}`}>
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
            )}
          </LogSection>
        </Card>
      </Page>
    </>
  );
}

export default App;
