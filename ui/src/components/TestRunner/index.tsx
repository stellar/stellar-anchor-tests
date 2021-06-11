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
import "./styles.scss";

// SEPs displayed in dropdown rendered in UI
const DROPDOWN_SEPS = [1, 6, 10, 12, 24, 31];
// SEPs to send to server based on SEP selected in dropdown
const DROPDOWN_SEPS_MAP: Record<number, Array<number>> = {
  1: [1],
  6: [1, 10, 12, 6],
  10: [1, 10],
  12: [1, 10, 12],
  24: [1, 10, 24],
  31: [1, 10, 12, 31]
};
// SEPs that require the config file field to be rendered in UI
const CONFIG_SEPS = [6, 12, 31];

interface FormData {
  homeDomain: string;
  seps: Array<number>;
  assetCode?: string;
  sepConfig?: any
}

enum RunState {
  noTests = "noTests",
  awaitingRun = "awaitingRun",
  running = "running",
  done = "done"
}

export const TestRunner = () => {
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
  const [runState, setRunState] = useState(RunState.noTests);

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
      setRunState(RunState.awaitingRun);
    });
    return () => {
      socket.off("getTests");
    };
  }, [testRunArray, testRunOrderMap, runState]);

  /*
   * runTests functionality
   */

  const handleSubmit = () => {
    clearTestResults();
    setRunState(RunState.running);
    socket.emit("runTests", formData, (error: Error) => {
      setServerFailure(
        `server failure occurred: ${error.name}: ${error.message}`
      );
    });
  };

  const clearTestResults = () => {
    const testRunArrayCopy = [...testRunArray];
    for (const testRun of testRunArrayCopy) {
      testRun.result = undefined;
    }
    setTestRunArray(testRunArrayCopy);
    setRunState(RunState.awaitingRun);
  };

  useEffect(() => {
    socket.on("runTests", ({ test, result }) => {
      const testRunArrayCopy = [...testRunArray];
      const testRun = testRunArrayCopy[testRunOrderMap[getTestRunId(test)]];
      testRun.result = result;
      setTestRunArray(testRunArrayCopy);
      if (testRunArrayCopy.every((testRun => testRun.result))) {
        setRunState(RunState.done);
      } 
    });
    return () => {
      socket.off("runTests");
    };
  }, [testRunArray, testRunOrderMap, runState]);

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { id, value } = e.target;
    if (id === "homeDomain" && !value.startsWith("http")) {
      value = "https://" + value;
    }
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    const sepNumber = value ? Number(value) : undefined;

    // retain config only if it is still needed
    let configValue; 
    if (sepNumber && CONFIG_SEPS.includes(sepNumber)) {
      setIsConfigNeeded(true);
      configValue = formData.sepConfig;
    } else {
      setIsConfigNeeded(false);
      configValue = undefined;
    }
    
    if (!sepNumber)
      setTestRunArray([]);

    setFormData({
      ...formData,
      sepConfig: configValue,
      [id]: sepNumber ? DROPDOWN_SEPS_MAP[sepNumber] : [],
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
          [id]: JSON.parse(e?.target?.result as string),
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
          <Button onClick={handleSubmit} disabled={ runState === RunState.running }>
            { (runState !== RunState.running) ? "Run Tests" : "Running..." }
          </Button>
          { (runState === RunState.done) && <Button onClick={clearTestResults}>Reset</Button> }
        </div>
        <div className="ButtonWrapper">
        </div>
      </div>
      <hr />
      <TestCases testCases={ testRunArray }></TestCases>
    </>
  );
};
