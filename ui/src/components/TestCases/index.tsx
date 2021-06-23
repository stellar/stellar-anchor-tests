import React from "react";
import styled from "styled-components";

import { getTestRunId } from "helpers/testCases";
import { GroupedTestCases, TestCase } from "types/testCases";
import { SepBlock } from "../SepBlock";
import { SepGroupTracker } from "./SepGroupTracker";
import { TestBlock } from "../TestBlock";

export const SepUIOrder = [1, 10, 12, 6, 24, 31];

const TestCasesWrapper = styled.section`
  margin-top: 2rem;
`;

export const TestCases: React.FC<{ testCases: GroupedTestCases }> = ({
  testCases,
}) => (
  <>
    <TestCasesWrapper>
      {testCases.map(
        (sepGroup: {
          progress: { running: number; total: number };
          sep: number;
          tests: TestCase[];
        }) => {
          return (
            <div key={`sep-${sepGroup.sep}-tests`}>
              <SepBlock sep={sepGroup.sep}></SepBlock>
              <SepGroupTracker
                currentlyRunning={sepGroup.progress.running}
                testsTotal={sepGroup.progress.total}
              />
              {sepGroup.tests.map((testCase: TestCase) => {
                return (
                  <TestBlock
                    key={getTestRunId(testCase.test)}
                    testCase={testCase}
                  ></TestBlock>
                );
              })}
            </div>
          );
        },
      )}
    </TestCasesWrapper>
  </>
);
