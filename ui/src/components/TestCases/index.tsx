import React, { useState } from "react";
import styled from "styled-components";
import { Icon } from "@stellar/design-system";

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

const SepBlockRight = styled.div`
  display: flex;
`;

const AccordionButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
`;

const AccordionIcon = styled.div`
  margin: 0.125rem 0 0 0.625rem;
  transform: rotate(
    ${({ isOpen }: { isOpen: boolean }) => (isOpen ? "90" : "0")}deg
  );
  transition: all 0.25s ease-in-out;
`;

interface SepTestsProps {
  accordionMaxHeight: number;
  isOpen: boolean;
}

const SepTests = styled.div`
  max-height: ${({ accordionMaxHeight, isOpen }: SepTestsProps) =>
    isOpen ? `${accordionMaxHeight * 5}rem` : "0"};
  overflow: hidden;
  transition: all 0.5s ease-in-out;
`;

interface AccordianState {
  [key: string]: boolean;
}

type AccordionToggleProps = {
  isOpen: boolean;
  onClick: () => void;
};

const AccordionToggle = ({ isOpen, onClick }: AccordionToggleProps) => {
  return (
    <AccordionButton onClick={onClick}>
      <AccordionIcon isOpen={isOpen}>
        <Icon.ChevronRight />
      </AccordionIcon>
    </AccordionButton>
  );
};

export const TestCases: React.FC<{
  runState: RunState;
  testCases: GroupedTestCases;
}> = ({ runState, testCases }) => {
  const [accordianState, setAccordianState] = useState({} as AccordianState);
  return (
    <>
      <TestCasesWrapper>
        {testCases.map(
          (sepGroup: {
            progress: { passed: number; failed: number; total: number };
            sep: number;
            tests: TestCase[];
          }) => {
            const sepGroupAccordionState = !!accordianState[sepGroup.sep];
            return (
              <SepGroupWrapper key={`sep-${sepGroup.sep}-tests`}>
                <SepBlock
                  progress={sepGroup.progress}
                  runState={runState}
                  sep={sepGroup.sep}
                >
                  <SepBlockRight>
                    <SepGroupTracker
                      progress={sepGroup.progress}
                      runState={runState}
                    />
                    <AccordionToggle
                      isOpen={sepGroupAccordionState}
                      onClick={() =>
                        setAccordianState({
                          ...accordianState,
                          [sepGroup.sep]: !sepGroupAccordionState,
                        })
                      }
                    />
                  </SepBlockRight>
                </SepBlock>
                <SepTests
                  accordionMaxHeight={sepGroup.tests.length}
                  isOpen={accordianState[sepGroup.sep]}
                >
                  {sepGroup.tests.map((testCase: TestCase, i: number) => (
                    <TestBlock
                      key={getTestRunId(testCase.test)}
                      isLastChild={i === sepGroup.tests.length - 1}
                      runState={runState}
                      testCase={testCase}
                    />
                  ))}
                </SepTests>
              </SepGroupWrapper>
            );
          },
        )}
      </TestCasesWrapper>
    </>
  );
};
