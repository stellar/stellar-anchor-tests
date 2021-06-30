import React, { useState } from "react";
import { Eyebrow, TextLink } from "@stellar/design-system";
import styled from "styled-components";
import { Response, Request } from "node-fetch";

import { Json } from "basics/Json";
import { Log, LogIndent } from "basics/Log";

const ResultBlockWrapperEl = styled.div`
  border-radius: 0.25rem;
  border: 1px solid #fbfaf7;
  padding: 1rem;
  padding-left: 2.5rem;
  width: 100%;
  line-height: 1.75rem;
  position: relative;

  p {
    color: inherit;
  }
`;

const ResultSectionEl = styled.div`
  margin-bottom: 1.5rem;
`;

const ResultLineEl = styled.div`
  margin: 0.5rem 0;
`;

const CollapseBtnEl = styled.div`
  margin: 1rem 0;
`;

const CollapsibleLogEl = styled.section`
  max-height: ${({ isCollapsed }: { isCollapsed: boolean }) =>
    isCollapsed ? "0rem" : "45rem"};
  overflow: hidden;
  transition: all 0.25s ease-in-out;
`;

interface NetworkCall {
  request: Request & { headers: { [key: string]: string[] } };
  response: Response;
}

interface HeaderBlockProps {
  headerKey: string;
  headerVal: string;
}

const HeaderBlock = ({ headerKey, headerVal }: HeaderBlockProps) => (
  <div>
    {headerKey}: {headerVal}
  </div>
);

export const ResultBlock: React.FC<{ result: any }> = ({ result }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <ResultBlockWrapperEl>
      <ResultSectionEl>
        <Eyebrow>Failure Type:</Eyebrow>
        {result.failureMode}
      </ResultSectionEl>
      <ResultSectionEl>
        <Eyebrow>Description:</Eyebrow>
        {result.failureMessage}
      </ResultSectionEl>
      <ResultSectionEl>
        <ResultLineEl>
          Expected: <strong>{result.expected}</strong>
        </ResultLineEl>
        <ResultLineEl>
          Received: <strong>{result.actual}</strong>
        </ResultLineEl>
      </ResultSectionEl>
      <CollapseBtnEl>
        <TextLink onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? "Show" : "Collapse"} full error
        </TextLink>
      </CollapseBtnEl>

      <CollapsibleLogEl isCollapsed={isCollapsed}>
        <Log>
          Network Calls:
          {result.networkCalls.map((networkCall: NetworkCall, i: number) => (
            <LogIndent key={`${networkCall.request.method}-${i}`}>
              {networkCall.request && (
                <>
                  <div>Request:</div>
                  <LogIndent>
                    {networkCall.request.method} {networkCall.request.url}
                    <div>Headers:</div>
                    <LogIndent>
                      {Object.entries(networkCall.request.headers || []).map(
                        ([headerKey, headerVal]) => (
                          <HeaderBlock
                            headerKey={headerKey}
                            headerVal={headerVal.toString()}
                            key={`${headerKey}-${headerVal}`}
                          />
                        ),
                      )}
                    </LogIndent>
                  </LogIndent>

                  <div>Body:</div>
                  <LogIndent>
                    <Json collapsed src={networkCall.request.body} />
                  </LogIndent>
                </>
              )}

              {networkCall.response && (
                <>
                  <div>Response:</div>
                  <LogIndent>
                    <div>Status Code: {networkCall.response.status}</div>
                    <div>Headers:</div>
                    <LogIndent>
                      {Object.entries(networkCall.response.headers || []).map(
                        ([headerKey, headerVal]) => (
                          <HeaderBlock
                            headerKey={headerKey}
                            headerVal={headerVal}
                            key={`${headerKey}-${headerVal}`}
                          />
                        ),
                      )}
                    </LogIndent>
                    <div>Body:</div>
                    <LogIndent>{networkCall.response.body}</LogIndent>
                  </LogIndent>
                </>
              )}
            </LogIndent>
          ))}
        </Log>
      </CollapsibleLogEl>
    </ResultBlockWrapperEl>
  );
};
