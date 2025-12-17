export type EntryType = "spending" | "vatCollected";

export type SpendingStatus = "spent" | "requested" | "claimed";

export type FormValues = {
  occurredAt: string;
  amount: number;
  description: string;
};

export type SpendingItem = {
  id: string;
  description: string;
  amount: number;
  status: SpendingStatus;
  amountError?: string;
  descriptionError?: string;
};

export type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };
