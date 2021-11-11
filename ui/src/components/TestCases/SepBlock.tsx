import { PieProgress, TextLink } from "@stellar/design-system";
import React from "react";
import styled from "styled-components";

import { TestCaseProgress } from "types/testCases";

const PieProgressWrapper = styled.div`
  margin-right: 1.25rem;
`;

const SepLink = styled.div`
  border-bottom: 1px solid var(--pal-border-secondary);
  display: flex;
  justify-content: space-between;
  line-height: 1.75rem;
  padding: 1.5rem 1rem 1.5rem 1.5rem;
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
  38: {
    name: "Request for Quote API",
    source:
      "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0038.md",
  },
};

export const SepBlock: React.FC<{
  children: React.ReactNode;
  progress: TestCaseProgress;
  sep: number;
}> = ({ children, progress, sep }) => {
  const { total, failed, passed } = progress;

  return (
    <SepLink>
      <SepInfo>
        <PieProgressWrapper>
          <PieProgress total={total} failed={failed} passed={passed} />
        </PieProgressWrapper>

        <TextLink href={sepData[sep].source}>
          SEP-{sep}: {sepData[sep].name}
        </TextLink>
      </SepInfo>

      {children}
    </SepLink>
  );
};
