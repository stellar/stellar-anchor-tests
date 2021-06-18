import React from "react";
import styled from "styled-components";

import { getTestRunId } from "helpers/testCases";
import { TestCase } from "types/testCases";
import { SepBlock } from "../SepBlock";
import { TestBlock } from "../TestBlock";

export const SepUIOrder = [1, 10, 12, 6, 24, 31];

type GroupedTestCases = { sep: number; tests: TestCase[] }[];

const TestCasesWrapper = styled.section`
  margin-top: 2rem;
`;

function groupBySep(testRuns: TestCase[]): GroupedTestCases {
  const groupedTestRuns = [];
  let currentSep;
  for (const testRun of testRuns) {
    if (Number(testRun.test.sep) !== currentSep) {
      currentSep = Number(testRun.test.sep);
      groupedTestRuns.push({
        sep: currentSep,
        tests: [] as TestCase[],
      });
    }
    const sepGroup = groupedTestRuns[groupedTestRuns.length - 1];
    sepGroup.tests.push(testRun);
  }
  return groupedTestRuns;
}

export const TestCases: React.FC<{ testCases: TestCase[] }> = ({
  testCases,
}) => {
  const groupedTestCases = groupBySep(testCases);
  return (
    <>
      <TestCasesWrapper>
        {groupedTestCases.map(
          (sepGroup: { sep: number; tests: TestCase[] }) => {
            return (
              <div key={`sep-${sepGroup.sep}-tests`}>
                <SepBlock sep={sepGroup.sep}></SepBlock>
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
};
