import React, { useState } from "react";
import { Eyebrow, TextLink } from "@stellar/design-system";
import styled from "styled-components";
import { Response, Request } from "node-fetch";

import { Log, LogTab } from "basics/Log";

const ResultBlockWrapperEl = styled.div`
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
    isCollapsed ? "0rem" : "40rem"};
  overflow: hidden;
  transition: all 0.25s ease-in-out;
`;

interface NetworkCall {
  request: Request & { headers: { [key: string]: string[] } };
  response: Response;
}

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
          {result.networkCalls.map((networkCall: NetworkCall) => (
            <LogTab>
              {networkCall.request && (
                <>
                  <div>Request:</div>
                  <LogTab>
                    {networkCall.request.method} {networkCall.request.url}
                    <div>Headers:</div>
                    <LogTab>
                      content-type:{" "}
                      {(
                        networkCall.request?.headers?.["Content-Type"] || []
                      ).map((contentType: string) => contentType)}
                    </LogTab>
                  </LogTab>

                  <div>Body:</div>
                  <div>{JSON.stringify(networkCall.request.body)}</div>
                </>
              )}

              {networkCall.response && (
                <>
                  <div>Response:</div>
                  <LogTab>
                    <div>Status Code: {networkCall.response.status}</div>
                    <div>Headers:</div>
                    <LogTab>
                      {Object.entries(networkCall.response.headers || []).map(
                        ([headerKey, headerVal]) => (
                          <div>
                            {headerKey}: {headerVal}
                          </div>
                        ),
                      )}
                    </LogTab>
                    <div>Body:</div>
                    <LogTab>{networkCall.response.body}</LogTab>
                  </LogTab>
                </>
              )}
            </LogTab>
          ))}
        </Log>
      </CollapsibleLogEl>
    </ResultBlockWrapperEl>
  );
};
