import React, { useState } from "react";
import { Eyebrow, TextLink } from "@stellar/design-system";
import styled from "styled-components";

import { Json } from "basics/Json";
import { Log, LogIndent } from "basics/Log";
import { Result, NetworkCall } from "types/testCases";

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

const ResourceLinkEl = styled.li`
  font-size: 0.875rem;
`;

const CollapseBtnEl = styled.div`
  margin: 1rem 0;
`;

const CollapsibleLogEl = styled.section`
  background: var(--pal-example-code);
  border-radius: 0.5rem;
  max-height: ${({ isCollapsed }: { isCollapsed: boolean }) =>
    isCollapsed ? "0rem" : "60rem"};
  overflow: hidden;
  transition: all 0.25s ease-in-out;
`;

interface HeaderBlockProps {
  headerKey: string;
  headerVal: string;
}

const HeaderBlock = ({ headerKey, headerVal }: HeaderBlockProps) => (
  <div>
    {headerKey}: {headerVal}
  </div>
);

export const ResultBlock: React.FC<{ result: Result }> = ({ result }) => {
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
      {result.expected && result.actual && (
        <ResultSectionEl>
          <ResultLineEl>
            Expected: <strong>{result.expected}</strong>
          </ResultLineEl>
          <ResultLineEl>
            Received: <strong>{result.actual}</strong>
          </ResultLineEl>
        </ResultSectionEl>
      )}

      {result.resourceLinks && (
        <ResultSectionEl>
          <Eyebrow>Resource Links:</Eyebrow>
          <ul>
            {Object.entries(result.resourceLinks || []).map(([title, link]) => (
              <ResourceLinkEl key={title}>
                <TextLink href={link}>{title}</TextLink>
              </ResourceLinkEl>
            ))}
          </ul>
        </ResultSectionEl>
      )}

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
                    {Object.keys(networkCall.request.headers).length && (
                      <>
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
                      </>
                    )}
                    {networkCall.request.body && (
                      <>
                        <div>Body:</div>
                        <LogIndent>
                          {typeof networkCall.request.body === "object" && (
                            <Json collapsed src={networkCall.request.body} />
                          )}
                          {typeof networkCall.request.body !== "object" && (
                            networkCall.request.body
                          )}
                        </LogIndent>
                      </>
                    )}
                  </LogIndent>
                </>
              )}

              {networkCall.response && (
                <>
                  <div>Response:</div>
                  <LogIndent>
                    <div>Status Code: {networkCall.response.status}</div>
                    {Object.keys(networkCall.response.headers).length && (
                      <>
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
                      </>
                    )}
                    <div>Body:</div>
                    <LogIndent>
                      <Json collapsed src={networkCall.response.body} />
                    </LogIndent>
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
