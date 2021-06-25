import React from "react";
import styled from "styled-components";

import { getTestRunId } from "helpers/testCases";
import { GroupedTestCases, RunState, TestCase } from "types/testCases";
import { SepBlock } from "./SepBlock";
import { SepGroupTracker } from "./SepGroupTracker";
import { TestBlock } from "./TestBlock";

export const SepUIOrder = [1, 10, 12, 6, 24, 31];

const TestCasesWrapper = styled.section`
  margin-top: 2rem;
`;

const SepGroupWrapper = styled.div`
  border: 1px solid var(--pal-border-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
`;

export const TestCases: React.FC<{
  runState: RunState;
  testCases: GroupedTestCases;
}> = ({ runState, testCases }) => (
  <>
    <TestCasesWrapper>
      {testCases.map(
        (sepGroup: {
          progress: { passed: number; failed: number; total: number };
          sep: number;
          tests: TestCase[];
        }) => {
          return (
            <SepGroupWrapper key={`sep-${sepGroup.sep}-tests`}>
              <SepBlock
                progress={sepGroup.progress}
                runState={runState}
                sep={sepGroup.sep}
              >
                <SepGroupTracker
                  progress={sepGroup.progress}
                  runState={runState}
                />
              </SepBlock>

              {sepGroup.tests.map((testCase: TestCase, i: number) => (
                <TestBlock
                  key={getTestRunId(testCase.test)}
                  isLastChild={i === sepGroup.tests.length - 1}
                  runState={runState}
                  testCase={testCase}
                />
              ))}
            </SepGroupWrapper>
          );
        },
      )}
    </TestCasesWrapper>
  </>
);
