import styled, { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #213560 0%, #1e3a8a 50%, #1e40af 100%);
    background-attachment: fixed;
    color: #0f172a;
    min-height: 100vh;
  }
`;

export const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
`;

export const Card = styled.section`
  width: min(960px, 100%);
  background: #ffffff;
  border: 1px solid rgba(33, 53, 96, 0.2);
  border-radius: 20px;
  box-shadow: 0 4px 12px -2px rgba(33, 53, 96, 0.12),
    0 2px 6px -2px rgba(33, 53, 96, 0.08);
  padding: 32px;
  display: grid;
  gap: 24px;

  @media (max-width: 720px) {
    padding: 20px;
  }
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

export const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  img {
    height: 40px;
    width: auto;
    display: block;
  }
`;

export const Title = styled.div`
  display: grid;
  gap: 6px;

  h1 {
    margin: 0;
    font-size: clamp(24px, 3vw, 30px);
    color: #213560;
    font-weight: 700;
  }

  p {
    margin: 0;
    color: #475569;
    font-size: 15px;
  }
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(33, 53, 96, 0.1);
  color: #213560;
  font-weight: 600;
  font-size: 14px;
  border: 1px solid rgba(33, 53, 96, 0.2);
`;

export const Form = styled.form`
  display: grid;
  gap: 20px;
`;

export const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
`;

export const Field = styled.label`
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: #1f2937;
`;

export const Input = styled.input`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(33, 53, 96, 0.2);
  background: #f8fafc;
  color: #0f172a;
  font-size: 15px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #213560;
    box-shadow: 0 0 0 3px rgba(33, 53, 96, 0.15);
  }
`;

export const SelectRow = styled.div`
  display: inline-flex;
  padding: 4px;
  border-radius: 12px;
  background: rgba(33, 53, 96, 0.05);
  border: 1px solid rgba(33, 53, 96, 0.2);
  gap: 6px;
  width: fit-content;
`;

export const SelectButton = styled.button<{ $active: boolean }>`
  border: 0;
  background: ${({ $active }) => ($active ? "#213560" : "transparent")};
  color: ${({ $active }) => ($active ? "#ffffff" : "#213560")};
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? "#1e3a8a" : "rgba(33, 53, 96, 0.1)")};
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Button = styled.button`
  border: 0;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  background: linear-gradient(135deg, #213560, #1e3a8a);
  color: #ffffff;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
  box-shadow: 0 2px 6px -1px rgba(33, 53, 96, 0.25);
  
  &:hover {
    transform: translateY(-1px);
    background: linear-gradient(135deg, #1e3a8a, #1e40af);
    box-shadow: 0 3px 8px -1px rgba(33, 53, 96, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

export const Status = styled.div<{ $tone: "success" | "error" | "muted" }>`
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

export const Helper = styled.span`
  font-size: 13px;
  margin-left: 12px;
  color: #64748b;
  display: block;
  margin-top: 4px;
  margin-left: 0;
`;

export const LogSection = styled.section`
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(33, 53, 96, 0.2);
  background: rgba(248, 250, 252, 0.8);
`;

export const LogHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const Tabs = styled.div<{ $activeIndex?: number; $count?: number }>`
  display: flex;
  gap: 0;
  border-bottom: 2px solid rgba(33, 53, 96, 0.2);
  margin-bottom: 16px;
  width: 100%;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: ${({ $activeIndex = 0, $count = 2 }) => `calc(${($activeIndex / ($count || 1)) * 100}% )`};
    width: ${({ $count = 2 }) => `${100 / $count}%`};
    height: 3px;
    background: #213560;
    transform-origin: center;
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 2px 2px 0 0;
    z-index: 2;
  }
`;

export const Tab = styled.button<{ $active: boolean }>`
  border: 0;
  background: transparent;
  color: ${({ $active }) => ($active ? "#213560" : "#64748b")};
  padding: 12px 16px;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  font-size: 14px;
  cursor: pointer;
  position: relative;
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), font-weight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex: 1;
  text-align: center;
  z-index: 1;

  &:hover {
    color: #213560;
    transition: color 0.2s ease;
  }
`;

export const LogList = styled.div`
  display: grid;
  gap: 8px;
`;

export const LogRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(240px, 1.6fr) minmax(180px, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid rgba(33, 53, 96, 0.15);
  font-size: 14px;
  color: #0f172a;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: rgba(33, 53, 96, 0.3);
    box-shadow: 0 1px 4px -1px rgba(33, 53, 96, 0.1);
  }

  .log-checkbox {
    flex-shrink: 0;
    grid-column: 1;
    grid-row: 1;
  }

  .log-main {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 8px;
    min-width: 0;
    grid-column: 2;
    grid-row: 1;
  }

  .log-date {
    flex-shrink: 0;
    color: #475569;
    font-weight: 600;
    white-space: nowrap;
  }

  .log-desc {
    flex: 1;
    min-width: 0;
    white-space: normal;
    overflow: visible;
    text-overflow: initial;
    color: #0f172a;
    font-weight: 600;
    line-height: 1.35;
  }

  .status-toggle {
    display: flex;
    justify-content: center;
    position: relative;
    grid-column: 3;
    grid-row: 1;
  }

  .log-status {
    flex: 1;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
  }

  @media (max-width: 900px) {
    grid-template-columns: auto minmax(0, 1.4fr) minmax(0, 1fr) auto;
    gap: 10px;
  }

  .log-amount {
    flex-shrink: 0;
    font-weight: 700;
    white-space: nowrap;
  }

  .delete-btn {
    flex-shrink: 0;
    width: auto;
    grid-column: 4;
    grid-row: 1;
  }

  @media (max-width: 640px) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 44px 12px 12px;

    .delete-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: auto;
      align-self: flex-start;
    }

    .log-checkbox {
      position: absolute;
      top: 10px;
      left: 10px;
      width: auto;
      order: 0;
    }

    .log-main {
      order: 1;
      width: 100%;
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 8px;
      padding-top: 8px;
    }

    .log-desc {
      white-space: normal;
      overflow: visible;
      text-overflow: initial;
      line-height: 1.3;
    }

    .status-toggle {
      order: 2;
      width: 100%;
      justify-content: flex-start;
      margin-top: 6px;
    }

    .log-amount {
      text-align: right;
      font-size: 16px;
      font-weight: 700;
    }

    .log-status {
      order: 3;
      width: 100%;
      text-align: left;
      font-size: 13px;
    }

    .log-checkbox {
      order: 0;
      width: auto;
    }
  }
`;

export const DeleteButton = styled.button`
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
  width: 'fit-content';

  &:hover {
    background: #fecaca;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const RemoveButton = styled.button`
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

export const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #213560;
`;

export const SelectionControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 10px;
  margin-bottom: 12px;
  border: 1px solid rgba(33, 53, 96, 0.2);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const SelectionActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 10px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(33, 53, 96, 0.2);
`;

export const LogRowContainer = styled.div`
  flex-direction: column;
  gap: 8px;
  display: flex;
  margin: 8px 0;
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

export const TotalDisplay = styled.div`
  padding: 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, #213560, #1e3a8a, #1e40af);
  color: #ffffff;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 3px 10px -2px rgba(33, 53, 96, 0.25);
  
  h2 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    opacity: 0.95;
    letter-spacing: 0.5px;
  }
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 12px;
    font-weight: 600;
    opacity: 0.9;
    letter-spacing: 0.5px;
  }
  
  .amount {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  .totals-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;
    align-items: center;
  }
  
  @media (max-width: 768px) {
    padding: 16px;
    
    .amount {
      font-size: 18px;
    }
    
    h3 {
      font-size: 11px;
    }
    
    .totals-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }
`;

export const LoadingOverlay = styled.div`
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

export const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid rgba(33, 53, 96, 0.2);
  border-top-color: #213560;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
