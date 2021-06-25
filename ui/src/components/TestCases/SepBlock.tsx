import { TextLink } from "@stellar/design-system";
import React from "react";
import styled from "styled-components";

import { RunState, TestCaseProgress } from "types/testCases";
import {
  FailedIcon,
  IdleIcon,
  LoadingIcon,
  PassedIcon,
} from "./basics/ProgressIcons";

const SepLink = styled.div`
  border-bottom: 1px solid var(--pal-border-secondary);
  display: flex;
  justify-content: space-between;
  line-height: 1.75rem;
  padding: 1.5rem;
  padding-left: 1.5rem;
  width: 100%;
`;

const SepInfo = styled.div`
  align-items: center;
  display: flex;
`;

const sepData: any = {
  1: {
    name: "Stellar Info File",
    source:
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md",
  },
  6: {
    name: "Deposit and Withdrawal API",
    source:
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md",
  },
  10: {
    name: "Stellar Web Authentication",
    source:
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md",
  },
  12: {
    name: "KYC API",
    source:
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md",
  },
  24: {
    name: "Hosted Deposit and Withdrawal",
    source:
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md",
  },
  31: {
    name: "Cross-Border Payments API",
    source:
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md",
  },
};

export const SepBlock: React.FC<{
  children: React.ReactNode;
  progress: TestCaseProgress;
  runState: RunState;
  sep: number;
}> = ({ children, progress, runState, sep }) => {
  const generateProgressIcon = () => {
    let ProgressIcon = <IdleIcon />;
    if (runState === RunState.running) {
      ProgressIcon = <LoadingIcon />;
    }
    if (progress.passed + progress.failed === progress.total) {
      ProgressIcon = <PassedIcon />;
    }

    if (progress.failed) {
      ProgressIcon = <FailedIcon />;
    }

    return ProgressIcon;
  };

  return (
    <SepLink>
      <SepInfo>
        {generateProgressIcon()}

        <TextLink href={sepData[sep].source}>
          SEP-{sep}: {sepData[sep].name}
        </TextLink>
      </SepInfo>

      {children}
    </SepLink>
  );
};
