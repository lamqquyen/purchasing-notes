export type EntryType = "spending" | "receiving";

export type FormValues = {
  occurredAt: string;
  amount: number;
  description: string;
};

export type SpendingItem = {
  id: string;
  description: string;
  amount: number;
  amountError?: string;
  descriptionError?: string;
};

export type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };
