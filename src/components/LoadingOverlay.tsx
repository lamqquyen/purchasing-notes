import { LoadingOverlay as StyledLoadingOverlay, Spinner } from "../styles";

export function LoadingOverlay() {
  return (
    <StyledLoadingOverlay>
      <Spinner />
    </StyledLoadingOverlay>
  );
}
