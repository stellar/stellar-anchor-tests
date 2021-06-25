import styled from "styled-components";

import { RunState, TestCase } from "types/testCases";
import {
  FailedIcon,
  IdleIcon,
  LoadingIcon,
  PassedIcon,
} from "./basics/ProgressIcons";
import { ResultBlock } from "../ResultBlock";

const TestBlockWrapper = styled.div`
  padding: 0 1.5rem;
`;

const TestBlockRow = styled.div`
  align-items: center;
  border-bottom: 1px solid
    ${({ isLastChild }: { isLastChild: boolean }) =>
      isLastChild ? "transparent" : "var(--pal-border-secondary)"};
  display: flex;
  padding: 1.3rem;
  padding-left: 0;
  width: 100%;
  line-height: 1.75rem;
`;

const TestInfo = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

interface TestGroupProps {
  bgColor: string;
  color: string;
}

const TestGroup = styled.div`
  background: ${({ bgColor }: TestGroupProps) => bgColor};
  color: ${({ color }: TestGroupProps) => color};
  border-radius: 0.125rem;
  font-size: 0.875rem;
  line-height: 1.375rem;
  padding: 0 0.375rem;
`;

export const TestBlock: React.FC<{
  isLastChild: boolean;
  runState: RunState;
  testCase: TestCase;
}> = ({ isLastChild, runState, testCase }) => {
  let textColor = "inherit";
  let bgColor = "var(--pal-border-primary)";
  let ProgressIcon = () => <IdleIcon />;
  const generateProgressIndicators = () => {
    if (runState === RunState.running) {
      ProgressIcon = () => <LoadingIcon />;
    }
    if (testCase.result) {
      if (Boolean(testCase.result.failureMode)) {
        textColor = "var(--pal-error)";
        bgColor = "rgba(var(--pal-error-rgb), 0.08)";
        ProgressIcon = () => <FailedIcon />;
      } else {
        textColor = "var(--pal-success)";
        bgColor = "rgba(var(--pal-success-rgb), 0.08)";
        ProgressIcon = () => <PassedIcon />;
      }
    }

    return ProgressIcon;
  };

  generateProgressIndicators();

  return (
    <TestBlockWrapper>
      <TestBlockRow isLastChild={isLastChild}>
        <ProgressIcon />
        <TestInfo>
          <div>{testCase.test.assertion}</div>
          <TestGroup bgColor={bgColor} color={textColor}>
            {testCase.test.group}
          </TestGroup>
        </TestInfo>
      </TestBlockRow>
      {testCase.result && testCase.result.failureMode && (
        <ResultBlock result={testCase.result}></ResultBlock>
      )}
    </TestBlockWrapper>
  );
};
