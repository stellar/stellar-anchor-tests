import React, { useRef, useEffect, useState } from "react";
import styled from "styled-components";
import {
  Button,
  Heading5,
  InfoBlock,
  Input,
  Layout,
  Select,
} from "@stellar/design-system";
import throttle from "lodash.throttle";

import { socket } from "helpers/socketConnection";

const DROPDOWN_SEPS = [6, 10, 12, 24, 31];

const CONFIG_SEPS = [6, 12, 31];

const TestConfigWrapper = styled.div`
  margin-bottom: 2rem;
  width: 20rem;
`;

const ButtonWrapper = styled.div`
  margin-top: 1rem;
`;

const TestHeader = styled.div`
  background: ${({ hasBackground }: { hasBackground: boolean }) =>
    hasBackground ? "#E5E5E5" : ""};
  padding: 2rem;
`;

export const TestRunner = () => {
  interface FormData {
    homeDomain: string;
    seps: Array<number>;
    assetCode?: string;
  }
  const [formData, setFormData] = useState({
    homeDomain: "",
    seps: [],
  } as FormData);
  const [serverFailure, setServerFailure] = useState("");
  const [isConfigNeeded, setIsConfigNeeded] = useState(false);

  type TestCollection = [string, { order: number; results: Array<any> }][];
  const [testCollection, setTestCollection] = useState([] as TestCollection);

  const throttled = useRef(
    throttle((newFormData) => {
      setServerFailure("");
      socket.emit("getTests", newFormData, (error: Error) => {
        if (error) {
          setServerFailure(
            `server failure occurred: ${error.name}: ${error.message}`
          );
        }
      });
    }, 250)
  );

  useEffect(() => {
    if (formData.seps.length) {
      throttled.current(formData);
    }
  }, [formData]);

  useEffect(() => {
    socket.on("getTests", (testData) => {
      /* 
        Group the test data by group name.
        Use the order key to maintain the order in which we received the tests.
      */

      const groupedTests = {} as {
        [key: string]: { order: number; results: Array<any> };
      };
      let order = 0;
      testData.forEach((test: { group: string }) => {
        if (!groupedTests[test.group]?.results) {
          order++;
          // we will populate the results array once we run the tests
          groupedTests[test.group] = { order, results: [] };
        }
      });

      /* 
        Arrange by order and place into an array of tuples:
        [ [groupName], { order: number, results: [] } ]
      */

      const arrangedTests = Object.entries(groupedTests).sort((a, b) => {
        return a[1].order - b[1].order;
      });
      setTestCollection(arrangedTests);
    });
    return () => {
      socket.off("getTests");
    };
  }, []);

  useEffect(() => {
    socket.on("runTests", (testResult) => {
      const testCollectionCopy = [...testCollection];

      // find the correct tuple in the array to push the results to
      const index = testCollectionCopy.findIndex(
        ([testName]) => testName === testResult.test.group
      );

      const testEntry = testCollectionCopy[index][1];

      /* 
        this omits duplicate assertions that may come back from the test results 
        before pushing to the results key 
      */
      if (
        !testEntry.results.some((result: { test: { assertion: string } }) => {
          return result.test.assertion === testResult.test.assertion;
        })
      ) {
        testEntry.results.push(testResult);
        setTestCollection(testCollectionCopy);
      }
    });

    return () => {
      socket.off("runTests");
    };
  }, [testCollection]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;

    const sepNumber = Number(value);

    if (CONFIG_SEPS.includes(sepNumber)) {
      setIsConfigNeeded(true);
    }

    setFormData({
      ...formData,
      [id]: [sepNumber],
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, files } = e.target;
    if (files?.length) {
      const fileReader = new FileReader();
      fileReader.readAsText(files[0], "UTF-8");
      fileReader.onload = (e) => {
        setFormData({
          ...formData,
          [id]: {
            [formData.seps[0]]: JSON.parse(e?.target?.result as string),
          },
        });
      };
    }
  };

  const handleSubmit = () => {
    throttled.current(formData);
    socket.emit("runTests", formData, (error: Error) => {
      console.log(`server failure occurred: ${error.name}: ${error.message}`);
    });
  };

  return (
    <>
      <TestConfigWrapper>
        <Layout.Inset>
          <Input
            id="homeDomain"
            label="Home Domain"
            onChange={handleFieldChange}
          />
          <Select id="seps" label="sep" onChange={handleSelectChange}>
            <option></option>
            {DROPDOWN_SEPS.map((sepNum) => (
              <option key={sepNum} value={sepNum}>
                Sep {sepNum}
              </option>
            ))}
          </Select>
          <Input id="assetCode" label="Currency" onChange={handleFieldChange} />
          {serverFailure && (
            <InfoBlock variant={InfoBlock.variant.error}>
              {serverFailure}
            </InfoBlock>
          )}
          {isConfigNeeded && (
            <ButtonWrapper>
              <Input
                id="sepConfig"
                label="Upload Config"
                onChange={handleFileChange}
                type="file"
              />
            </ButtonWrapper>
          )}

          <ButtonWrapper>
            <Button onClick={handleSubmit}>Run Tests</Button>
          </ButtonWrapper>
        </Layout.Inset>
      </TestConfigWrapper>
      <hr />
      <Heading5>TEST CASES</Heading5>
      <Layout.Inset>
        {testCollection.map(([testName, { results }], index) => {
          return (
            <div key={testName}>
              <TestHeader hasBackground={!Boolean(index % 2)}>
                {testName}
              </TestHeader>
              {results.map(
                (item: {
                  result: { failureMode: undefined | string };
                  test: { assertion: string };
                }) => {
                  return (
                    <InfoBlock
                      key={item.test.assertion}
                      variant={
                        Boolean(item.result.failureMode)
                          ? InfoBlock.variant.error
                          : InfoBlock.variant.success
                      }
                    >
                      {item.test.assertion}
                    </InfoBlock>
                  );
                }
              )}
            </div>
          );
        })}
      </Layout.Inset>
    </>
  );
};
