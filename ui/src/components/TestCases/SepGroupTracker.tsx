import styled from "styled-components";

import { COLOR_PALETTE } from "constants/styles";
import { RunState, TestCaseProgress } from "types/testCases";

const SepGroupTrackerWrapper = styled.div`
  display: flex;
`;

const ErrorReport = styled.div`
  ${({ failed }: { failed: boolean }) =>
    failed ? `color: ${COLOR_PALETTE.failed};` : ""}
  margin-left: 1.5rem;
`;

export const SepGroupTracker: React.FC<{
  progress: TestCaseProgress;
  runState: RunState;
}> = ({ progress, runState }) => {
  const generateProgress = () => {
    const completed = progress.failed + progress.passed;
    switch (runState) {
      case RunState.awaitingRun:
        return `${progress.total} Tests`;
      case RunState.running:
        return `Running ${completed} of ${progress.total}...`;
      case RunState.done:
        return `Completed ${completed} of ${progress.total}`;
      default:
        return;
    }
  };
  const generateErrorReport = () => {
    if (runState !== RunState.awaitingRun) {
      return (
        <ErrorReport failed={Boolean(progress.failed)}>
          {progress.failed} Error{progress.failed > 1 ? "s" : ""}
        </ErrorReport>
      );
    }
    return null;
  };
  return (
    <SepGroupTrackerWrapper>
      <div>{generateProgress()}</div>
      {generateErrorReport()}
    </SepGroupTrackerWrapper>
  );
};
