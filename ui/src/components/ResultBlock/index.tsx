import React from "react";
import styled from "styled-components";

const ResultBlockWrapper = styled.div`
  border-radius: 0.25rem;
  border: 1px solid transparent;
  padding: 1rem;
  padding-left: 2.5rem;
  width: 100%;
  line-height: 1.75rem;
  position: relative;

  p {
    color: inherit;
  }
`;

export const ResultBlock: React.FC<{ result: any }> = ({ result }) => (
  <ResultBlockWrapper>
    {result.failureMode && result.failureMessage}
  </ResultBlockWrapper>
);
