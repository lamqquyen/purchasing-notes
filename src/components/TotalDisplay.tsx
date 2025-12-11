import { useState, useEffect } from "react";
import styled from "styled-components";
import { TotalDisplay as StyledTotalDisplay } from "../styles";
import type { MonthlyTotals, AvailableMonth } from "../services/sheets";
import { fetchAvailableMonths, fetchMonthlyTotals } from "../services/sheets";

const LightSpinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

interface TotalDisplayProps {
  // Keep for backward compatibility, but we'll use monthly data
  totals?: any;
  refreshKey?: number; // When this changes, refresh the data
}

export function TotalDisplay({ totals, refreshKey }: TotalDisplayProps) {
  const [availableMonths, setAvailableMonths] = useState<AvailableMonth[]>([]);
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>("");
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotals | null>(null);
  const [isLoadingMonths, setIsLoadingMonths] = useState(true);
  const [isLoadingTotals, setIsLoadingTotals] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMonths = async () => {
    setIsLoadingMonths(true);
    setError(null);
    try {
      const months = await fetchAvailableMonths();
      
      if (Array.isArray(months) && months.length > 0) {
        setAvailableMonths(months);
        // Set default to most recent month (first in sorted array)
        const firstMonth = months[0].monthYear;
        setSelectedMonthYear(firstMonth);
        // Fetch totals for the first month
        try {
          const totals = await fetchMonthlyTotals(firstMonth);
          setMonthlyTotals(totals);
        } catch (error) {
          console.error("Failed to fetch monthly totals:", error);
          setMonthlyTotals({ totalPaid: 0, totalClaimed: 0, remaining: 0 });
        }
      } else {
        setAvailableMonths([]);
        setMonthlyTotals(null);
        setError("No monthly data found. Please add some transactions first.");
      }
    } catch (error) {
      console.error("Failed to fetch available months:", error);
      setError("Failed to load months. Please try again.");
      setAvailableMonths([]);
      setMonthlyTotals(null);
    } finally {
      setIsLoadingMonths(false);
      setIsInitialLoad(false);
    }
  };

  // Fetch available months on mount and when refreshKey changes
  useEffect(() => {
    refreshMonths();
  }, [refreshKey]);

  // Fetch monthly totals when month selection changes (but not on initial load)
  useEffect(() => {
    if (!selectedMonthYear || isInitialLoad) return;

    const loadMonthlyTotals = async () => {
      setIsLoadingTotals(true);
      try {
        const totals = await fetchMonthlyTotals(selectedMonthYear);
        setMonthlyTotals(totals);
      } catch (error) {
        console.error("Failed to fetch monthly totals:", error);
        setMonthlyTotals({ totalPaid: 0, totalClaimed: 0, remaining: 0 });
      } finally {
        setIsLoadingTotals(false);
      }
    };
    loadMonthlyTotals();
  }, [selectedMonthYear, isInitialLoad]);

  const displayTotals = monthlyTotals || { totalPaid: 0, totalClaimed: 0, remaining: 0 };
  const isLoading = isLoadingMonths || (isInitialLoad && selectedMonthYear && !monthlyTotals);

  return (
    <StyledTotalDisplay>
      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <LightSpinner />
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", color: "#ffffff", padding: "20px" }}>
          <div>{error}</div>
          <button
            onClick={refreshMonths}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.95)",
              color: "#213560",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Retry
          </button>
        </div>
      ) : availableMonths.length === 0 ? (
        <div style={{ textAlign: "center", color: "#ffffff", padding: "20px" }}>
          <div>No monthly data available</div>
          <button
            onClick={refreshMonths}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              borderRadius: "8px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              background: "rgba(255, 255, 255, 0.95)",
              color: "#213560",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Refresh
          </button>
        </div>
      ) : (
        <>
          <div style={{ 
            marginBottom: "16px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px"
          }}>
            <label style={{ 
              color: "#ffffff", 
              fontSize: "14px", 
              fontWeight: 600,
              opacity: 0.95
            }}>
              Select Month/Year:
            </label>
            <select
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                background: "rgba(255, 255, 255, 0.95)",
                color: "#213560",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                minWidth: "150px"
              }}
            >
              {availableMonths.map((month) => (
                <option key={month.monthYear} value={month.monthYear}>
                  {month.monthYear}
                </option>
              ))}
            </select>
          </div>
          <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(3, 1fr)", 
              gap: "16px", 
              width: "100%",
              alignItems: "center"
            }}
            className="totals-grid"
            >
              <div>
                <h3>Total Paid</h3>
                <p className="amount">{displayTotals.totalPaid.toLocaleString("vi-VN")} đ</p>
              </div>
              <div>
                <h3>Total Claimed</h3>
                <p className="amount">{displayTotals.totalClaimed.toLocaleString("vi-VN")} đ</p>
              </div>
              <div>
                <h3>Remaining</h3>
                <p className="amount">{displayTotals.remaining.toLocaleString("vi-VN")} đ</p>
              </div>
            </div>
        </>
      )}
    </StyledTotalDisplay>
  );
}
