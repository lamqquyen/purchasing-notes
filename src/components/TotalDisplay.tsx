import { TotalDisplay as StyledTotalDisplay } from "../styles";

interface TotalDisplayProps {
  total: number | null;
}

export function TotalDisplay({ total }: TotalDisplayProps) {
  if (total === null) return null;

  return (
    <StyledTotalDisplay>
      <h2>Tổng tiền còn lại</h2>
      <p className="amount">{total.toLocaleString("vi-VN")} đ</p>
    </StyledTotalDisplay>
  );
}
