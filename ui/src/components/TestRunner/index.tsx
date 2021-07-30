import { useRef, useEffect, useState } from "react";
import {
  Button,
  InfoBlock,
  Input,
  Modal,
  Select,
  TextLink,
} from "@stellar/design-system";
import throttle from "lodash.throttle";
import styled from "styled-components";

import { FieldWrapper } from "basics/FieldWrapper";
import { ModalInfoButton, TooltipInfoButton } from "basics/Tooltip";
import { socket } from "helpers/socketConnection";
import { getTestRunId, parseTests } from "helpers/testCases";
import { getSupportedAssets } from "helpers/utils";
import {
  FormData,
  GroupedTestCases,
  RunState,
  TestCase,
} from "types/testCases";
import { HomeDomainField } from "../TestRunnerFields/HomeDomainField";
import { TestCases } from "../TestCases";
import { ConfigModalContent } from "../ConfigModalContent";

// SEPs to send to server based on SEP selected in dropdown
const DROPDOWN_SEPS_MAP: Record<number, Array<number>> = {
  1: [1],
  6: [1, 10, 12, 6],
  10: [1, 10],
  12: [1, 10, 12],
  24: [1, 10, 24],
  31: [1, 10, 12, 31],
};
// SEPs that require the config file field to be rendered in UI
const CONFIG_SEPS = [6, 12, 31];
// SEPs that require an asset to use in tests
const TRANSFER_SEPS = [6, 24, 31];

const TestConfigWrapper = styled.form`
  margin-bottom: 4.5rem;
  width: 25rem;
`;

const ResetButtonWrapper = styled.div`
  margin-left: 1rem;
`;

const defaultFormData = {
  homeDomain: "",
  seps: [],
  verbose: true,
} as FormData;

export const TestRunner = () => {
  const [formData, setFormData] = useState(defaultFormData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [serverFailure, setServerFailure] = useState("");
  const [isConfigNeeded, setIsConfigNeeded] = useState(false);
  const [testRunArray, setTestRunArray] = useState([] as GroupedTestCases);
  const [testRunOrderMap, setTestRunOrderMap] = useState(
    {} as Record<string, number>,
  );
  const [runState, setRunState] = useState(RunState.noTests);
  const [toml, setToml] = useState(
    undefined as undefined | { [key in string]: string },
  );
  const [supportedAssets, setSupportedAssets] = useState([] as string[]);
  const [supportedSeps, setSupportedSeps] = useState([] as number[]);

  const resetAllState = () => {
    setRunState(RunState.noTests);
    setServerFailure("");
    setIsConfigNeeded(false);
    setSupportedAssets([]);
    setSupportedSeps([]);
    setToml(undefined);
    setTestRunArray([]);
    setTestRunOrderMap({});
    setFormData(defaultFormData);
  };

  const groupBySep = (testRuns: TestCase[]) => {
    const groupedTestRuns = [];
    let currentSep;
    for (const testRun of testRuns) {
      if (Number(testRun.test.sep) !== currentSep) {
        currentSep = Number(testRun.test.sep);
        groupedTestRuns.push({
          progress: { passed: 0, failed: 0, total: 0 },
          sep: currentSep,
          tests: [] as TestCase[],
        });
      }
      const sepGroup = groupedTestRuns[groupedTestRuns.length - 1];
      sepGroup.progress.total++;
      sepGroup.tests.push(testRun);
    }
    return groupedTestRuns;
  };

  const validateFormData = () =>
    !!formData.seps.length && !!formData.homeDomain;

  // add/remove websocket listener for getTests on component mount/dismount
  useEffect(() => {
    socket.on("getTests", (tests) => {
      const testRunOrderMap: Record<string, number> = {};
      const testRuns = parseTests(tests);
      let testIndex = 0;
      let currentSep = "";
      for (const testRun of testRuns) {
        const testRunSep = testRun.test.sep;
        if (testRunSep !== currentSep) {
          currentSep = testRunSep;
          testIndex = 0;
        }
        testRunOrderMap[getTestRunId(testRun.test)] = testIndex++;
      }

      setTestRunOrderMap(testRunOrderMap);
      setTestRunArray(groupBySep(testRuns));
      setRunState(RunState.awaitingRun);
    });
    return () => {
      socket.off("getTests");
    };
  }, []);

  // track how many tests have been run and returned results
  const numberOfTestsRun = useRef(0);

  // add/remove websocket listener for runTests on component mount/dismount
  useEffect(() => {
    // the total number of tests we expect results for
    const totalTestsToRun = Object.keys(testRunOrderMap).length;

    socket.on("runTests", ({ test, result }) => {
      const testRunArrayCopy = [...testRunArray];
      const sepArray = testRunArrayCopy.find(({ sep }) => sep === test.sep);
      if (sepArray) {
        const testRun = sepArray.tests[testRunOrderMap[getTestRunId(test)]];
        if (result) {
          if (result.failureMode) {
            sepArray.progress.failed++;
          } else {
            sepArray.progress.passed++;
          }
          numberOfTestsRun.current++;
        }
        testRun.result = result;
      }
      setTestRunArray(testRunArrayCopy);

      // if we've received results for all the tests we were expecting, we're done
      if (numberOfTestsRun.current === totalTestsToRun) {
        setRunState(RunState.done);
      }
    });
    return () => {
      socket.off("runTests");
    };
  }, [numberOfTestsRun, testRunArray, testRunOrderMap]);

  // make getTests request at most once every 250 milliseconds
  const getTestsThrottled = useRef(
    throttle((newFormData) => {
      socket.emit("getTests", newFormData, (error: Error) => {
        setServerFailure(
          `server failure occurred: ${error.name}: ${error.message}`,
        );
      });
    }, 250),
  );

  const getSupportedAssetsRef = useRef(
    throttle(async (domain: string, sep: number) => {
      const fetchedSupportedAssets = await getSupportedAssets(domain, sep);
      setSupportedAssets(fetchedSupportedAssets);
      if (fetchedSupportedAssets.length)
        setFormData({
          ...formData,
          assetCode: fetchedSupportedAssets[0],
        });
    }, 250),
  );

  // onClick handler for 'Run Tests' button
  const handleSubmit = () => {
    clearTestResults();
    setRunState(RunState.running);
    socket.emit("runTests", formData, (error: Error) => {
      setServerFailure(
        `server failure occurred: ${error.name}: ${error.message}`,
      );
    });
  };

  // onClick handler for 'Reset' button
  const clearTestResults = () => {
    numberOfTestsRun.current = 0;
    const testRunArrayCopy = [...testRunArray];
    testRunArrayCopy.forEach((group) => {
      group.progress.passed = group.progress.failed = 0;
      for (const testRun of group.tests) {
        testRun.result = undefined;
      }
    });

    setTestRunArray(testRunArrayCopy);
    setRunState(RunState.awaitingRun);
  };

  /*const updateNetworkState = (network: string | undefined) => {
    if (network) {
      if (Networks.TESTNET === network) {
        setIsTestnet(true);
      } else if (Networks.PUBLIC === network) {
        setIsTestnet(false);
      } else {
        setIsTestnet(undefined);
      }
    } else {
      setIsTestnet(undefined);
    }
  }*/

  const updateSupportedAssetsState = async (sep: number | undefined) => {
    if (!sep || !TRANSFER_SEPS.includes(sep)) {
      setSupportedAssets([]);
      return;
    }
    const tomlAttribute = {
      6: "TRANSFER_SERVER",
      24: "TRANSFER_SERVER_SEP0024",
      31: "DIRECT_PAYMENT_SERVER",
    }[sep];
    if (!toml || !toml[tomlAttribute as string]) {
      setServerFailure(`The SEP-1 stellar.toml file has no ${tomlAttribute}.`);
      setSupportedAssets([]);
      return;
    }
    await getSupportedAssetsRef.current(toml[tomlAttribute as string], sep);
  };

  const handleSepChange = async (value: string) => {
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

    const newFormData = {
      ...formData,
      sepConfig: configValue,
      seps: sepNumber ? DROPDOWN_SEPS_MAP[sepNumber] : [],
    };

    if (!sepNumber) {
      setTestRunArray([]);
      setTestRunOrderMap({});
    } else {
      getTestsThrottled.current(newFormData);
    }

    await updateSupportedAssetsState(sepNumber);
    setFormData(newFormData);
  };

  const handleAssetCodeChange = (value: string) => {
    setFormData({
      ...formData,
      assetCode: value,
    });
  };

  const handleFileChange = (files: FileList | null) => {
    if (files?.length) {
      const fileReader = new FileReader();
      fileReader.readAsText(files[0], "UTF-8");
      fileReader.onload = (e) => {
        let sepConfigObj;
        try {
          sepConfigObj = JSON.parse(e?.target?.result as string);
        } catch {
          setServerFailure(
            "Unable to parse config file JSON. Try correcting the format using a validator.",
          );
          return;
        }
        setServerFailure("");
        setFormData({
          ...formData,
          sepConfig: sepConfigObj,
        });
      };
    }
  };

  return (
    <>
      <TestConfigWrapper>
        <HomeDomainField
          formData={formData}
          resetAllState={resetAllState}
          setFormData={setFormData}
          setServerFailure={setServerFailure}
          setToml={setToml}
          setSupportedSeps={setSupportedSeps}
          toml={toml}
        />
        {supportedSeps.length !== 0 && (
          <FieldWrapper>
            <Select
              id="seps"
              label="sep"
              onChange={(e) => handleSepChange(e.target.value)}
            >
              <option></option>
              {supportedSeps.map((sepNum) => (
                <option key={sepNum} value={String(sepNum)}>
                  SEP-{sepNum}
                </option>
              ))}
            </Select>
            <TooltipInfoButton>
              <>
                <p>
                  Select one of the SEPs to test. The options displayed are
                  generated based on the attributes present in the anchor's{" "}
                  <TextLink
                    underline={true}
                    href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md"
                  >
                    Stellar Info File
                  </TextLink>
                  .
                </p>
                <p>
                  <strong>Note</strong>: Running tests for a particular SEP will
                  run tests for all SEPs that it requires. For example, running
                  SEP-10 tests will also run SEP-1 tests.
                </p>
              </>
            </TooltipInfoButton>
          </FieldWrapper>
        )}
        {supportedAssets.length !== 0 && (
          <FieldWrapper>
            <Select
              id="assetCode"
              label="Asset"
              onChange={(e) => handleAssetCodeChange(e.target.value)}
            >
              {supportedAssets.map((assetCode) => (
                <option key={assetCode} value={assetCode}>
                  {assetCode}
                </option>
              ))}
            </Select>
            <TooltipInfoButton>
              <p>
                Select the asset code to use when making requests to the anchor.
                The options displayed are generated based on the asset codes
                present in the anchors GET /info response.
              </p>
            </TooltipInfoButton>
          </FieldWrapper>
        )}
        {isConfigNeeded && (
          <FieldWrapper>
            <Input
              id="sepConfig"
              label="Upload Config"
              onChange={(e) => handleFileChange(e.target.files)}
              type="file"
            />
            <ModalInfoButton onClick={() => setIsModalVisible(true)} />

            <Modal
              visible={isModalVisible}
              onClose={() => setIsModalVisible(false)}
            >
              <ConfigModalContent></ConfigModalContent>
            </Modal>
          </FieldWrapper>
        )}
        {serverFailure && (
          <InfoBlock variant={InfoBlock.variant.error}>
            {serverFailure}
          </InfoBlock>
        )}
        {validateFormData() && (
          <FieldWrapper>
            <FieldWrapper>
              <Button
                onClick={handleSubmit}
                disabled={
                  [RunState.running, RunState.noTests].includes(runState) ||
                  Boolean(serverFailure)
                }
              >
                {runState !== RunState.running ? "Run Tests" : "Running..."}
              </Button>
              {runState === RunState.done && (
                <ResetButtonWrapper>
                  <Button onClick={clearTestResults}>Reset</Button>
                </ResetButtonWrapper>
              )}
            </FieldWrapper>
          </FieldWrapper>
        )}
      </TestConfigWrapper>
      <TestCases runState={runState} testCases={testRunArray} />
    </>
  );
};
