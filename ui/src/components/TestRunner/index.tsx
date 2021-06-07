import React, { useRef, useEffect, useState } from "react";
import {
  Button,
  InfoBlock,
  Input,
  Select,
} from "@stellar/design-system";
import throttle from "lodash.throttle";

import { socket } from "helpers/socketConnection";
import { TestCases, TestCase, parseTests, getTestRunId } from "../TestCases"

// SEPs displayed in dropdown rendered in UI
const DROPDOWN_SEPS = [1, 6, 10, 12, 24, 31];
// SEPs that require the config field to be rendered in UI
const CONFIG_SEPS = [6, 12, 31];

export const TestRunner = () => {
  interface FormData {
    homeDomain: string;
    seps: Array<number>;
    assetCode?: string;
  }

  const [formData, setFormData] = useState(
    {
      homeDomain: "",
      seps: [],
    } as FormData
  );
  const [serverFailure, setServerFailure] = useState("");
  const [isConfigNeeded, setIsConfigNeeded] = useState(false);
  const [testRunArray, setTestRunArray] = useState([] as TestCase[]); 
  const [testRunOrderMap, setTestRunOrderMap] = useState({} as Record<string, number>);

  /*
   * getTests functionality
   */

  // make getTests request at most once every 250 milliseconds
  const getTestsThrottled = useRef(
    throttle((newFormData) => {
      setServerFailure("");
      socket.emit("getTests", newFormData, (error: Error) => {
        setServerFailure(
          `server failure occurred: ${error.name}: ${error.message}`
        );
      });
    }, 250)
  );

  useEffect(() => {
    if (formData.homeDomain && formData.seps.length) {
      getTestsThrottled.current(formData);
    }
  }, [formData]);

  useEffect(() => {
    socket.on("getTests", (tests) => {
      const testRunOrderMap: Record<string, number> = {};
      const testRuns = parseTests(tests);
      let i = 0;
      for (const testRun of testRuns)
        testRunOrderMap[getTestRunId(testRun.test)] = i++;
      setTestRunOrderMap(testRunOrderMap);
      setTestRunArray(testRuns);
    });
    return () => {
      socket.off("getTests");
    };
  }, [testRunArray, testRunOrderMap]);

  /*
   * runTests functionality
   */

  const handleSubmit = () => {
    socket.emit("runTests", formData, (error: Error) => {
      setServerFailure(
        `server failure occurred: ${error.name}: ${error.message}`
      );
    });
  };

  useEffect(() => {
    socket.on("runTests", ({ test, result }) => {
      const testRunArrayCopy = [...testRunArray];
      const testRun = testRunArrayCopy[testRunOrderMap[getTestRunId(test)]];
      testRun.result = result;
      setTestRunArray(testRunArrayCopy);
    });
    return () => {
      socket.off("runTests");
    };
  }, [testRunArray, testRunOrderMap]);

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

  return (
    <>
      <div className="TestConfigWrapper">
        <Input
          id="homeDomain"
          label="Home Domain"
          onChange={handleFieldChange}
        />
        <Select id="seps" label="sep" onChange={handleSelectChange}>
          <option></option>
          {DROPDOWN_SEPS.map((sepNum) => (
            <option key={sepNum} value={sepNum}>
              SEP-{sepNum}
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
          <div className="ButtonWrapper">
            <Input
              id="sepConfig"
              label="Upload Config"
              onChange={handleFileChange}
              type="file"
            />
          </div>
        )}
        <div className="ButtonWrapper">
          <Button onClick={handleSubmit}>Run Tests</Button>
        </div>
      </div>
      <hr />
      <TestCases testCases={ testRunArray }></TestCases>
    </>
  );
};
