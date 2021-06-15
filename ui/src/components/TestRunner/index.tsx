import React, { useRef, useEffect, useState } from "react";
import {
  Button,
  InfoBlock,
  Input,
  Select,
} from "@stellar/design-system";
import throttle from "lodash.throttle";
import { Networks, StellarTomlResolver } from "stellar-sdk";

import { socket } from "helpers/socketConnection";
import { getSupportedAssets } from "helpers/utils";
import { TestCases, TestCase, parseTests, getTestRunId } from "../TestCases"
import "./styles.scss";

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
// SEPs that require an asset to use in tests
const TRANSFER_SEPS = [6, 24, 31];

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
  const [formData, setFormData] = useState({
    homeDomain: "",
    seps: [],
  } as FormData);
  const [serverFailure, setServerFailure] = useState("");
  const [isConfigNeeded, setIsConfigNeeded] = useState(false);
  const [testRunArray, setTestRunArray] = useState([] as TestCase[]); 
  const [testRunOrderMap, setTestRunOrderMap] = useState({} as Record<string, number>);
  const [runState, setRunState] = useState(RunState.noTests);
  const [toml, setToml] = useState(undefined as undefined | { [key in string]: string });
  const [supportedAssets, setSupportedAssets] = useState([] as string[]);
  const [supportedSeps, setSupportedSeps] = useState([] as number[]);
  // TODO: add testnet / pubnet label next to home domain input
  const [_isTestnet, setIsTestnet] = useState(undefined as undefined | Boolean);

  function resetAllState() {
    setIsTestnet(undefined);
    setRunState(RunState.noTests);
    setServerFailure("");
    setIsConfigNeeded(false);
    setSupportedAssets([]);
    setSupportedSeps([]);
    setToml(undefined);
    setTestRunArray([]);
    setTestRunOrderMap({});
  }

  useEffect(() => {
    if (formData.homeDomain) {
      getTomlThrottled.current(formData.homeDomain);
    }
  }, [formData.homeDomain]);

  useEffect(() => {
    if (formData.homeDomain && formData.seps.length) {
      getTestsThrottled.current(formData);
    }
  }, [formData, formData.homeDomain, formData.seps])

  useEffect(() => {
    if (toml && toml.NETWORK_PASSPHRASE) {
      if (Networks.TESTNET === toml.NETWORK_PASSPHRASE) {
        setIsTestnet(true);
      } else if (Networks.PUBLIC === toml.NETWORK_PASSPHRASE) {
        setIsTestnet(false);
      } else {
        setIsTestnet(undefined);
      }
    } else {
      setIsTestnet(undefined);
    }
    if (toml) {
      const newSupportedSeps = [1];
      if (toml.TRANSFER_SERVER) {
        newSupportedSeps.push(6);
      }
      if (toml.WEB_AUTH_ENDPOINT) {
        newSupportedSeps.push(10);
      }
      if (toml.KYC_SERVER) {
        newSupportedSeps.push(12);
      }
      if (toml.TRANSFER_SERVER_SEP0024) {
        newSupportedSeps.push(24);
      }
      if (toml.DIRECT_PAYMENT_SERVER) {
        newSupportedSeps.push(31);
      }
      setSupportedSeps(newSupportedSeps);
    }
    if (
      formData.homeDomain && 
      formData.seps.length && 
      toml && 
      TRANSFER_SEPS.includes(formData.seps[formData.seps.length - 1])
    ) {
      const transferSep = formData.seps[formData.seps.length - 1];
      const tomlAttribute = {
        6: "TRANSFER_SERVER",
        24: "TRANSFER_SERVER_SEP0024",
        31: "DIRECT_PAYMENT_SERVER"
      }[transferSep];
      if (!toml[tomlAttribute as string]) {
        setServerFailure(
          `The SEP-1 stellar.toml file has no ${tomlAttribute}.`
        );
        setSupportedAssets([]);
        return;
      }
      getSupportedAssetsRef.current(
        toml[tomlAttribute as string], transferSep
      );
    } else {
      setSupportedAssets([]);
    }
  }, [formData.homeDomain, formData.seps, toml]);

  // add/remove websocket listener for getTests on component mount/dismount
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
  }, [testRunArray, testRunOrderMap]);

  // add/remove websocket listener for runTests on component mount/dismount
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
  }, [testRunArray, testRunOrderMap]);

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

  // make toml requests at most once every 250 milliseconds
  const getTomlThrottled = useRef(
    throttle(async (homeDomain) => {
      try {
        const homeDomainHost = new URL(homeDomain).host;
        setToml(await StellarTomlResolver.resolve(homeDomainHost));
      } catch {
        resetAllState();
        setServerFailure("unable to fetch SEP-1 stellar.toml file");
        return;
      }
      setServerFailure("");
    }, 250)
  );

  const getSupportedAssetsRef = useRef(
    throttle(async (domain: string, sep: number) => {
      try {
        setSupportedAssets(await getSupportedAssets(domain, sep));
      } catch {
        setServerFailure(
          `Failed to fetch supported assets from ${domain}`
        );
        setSupportedAssets([]);
      }
    }, 250)
  );

  // onClick handler for 'Run Tests' button
  const handleSubmit = () => {
    clearTestResults();
    setRunState(RunState.running);
    socket.emit("runTests", formData, (error: Error) => {
      setServerFailure(
        `server failure occurred: ${error.name}: ${error.message}`
      );
    });
  };

  // onClick handler for 'Reset' button
  const clearTestResults = () => {
    const testRunArrayCopy = [...testRunArray];
    for (const testRun of testRunArrayCopy) {
      testRun.result = undefined;
    }
    setTestRunArray(testRunArrayCopy);
    setRunState(RunState.awaitingRun);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { id, value } = e.target;
    if (id === "homeDomain") {
      if (value && !value.startsWith("http")) {
        value = "https://" + value;
      } else if (!value) {
        resetAllState();
      }
    }
    setFormData({
      ...formData,
      [id]: value,
    });
  };

  const handleSepChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

    if (!sepNumber) {
      setTestRunArray([]);
      setTestRunOrderMap({});
    }
    
    setFormData({
      ...formData,
      sepConfig: configValue,
      [id]: sepNumber ? DROPDOWN_SEPS_MAP[sepNumber] : []
    });
  };

  const handleAssetCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData({
      ...formData,
      [id]: value
    })
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
        <div className="HomeDomainRow">
          <Input
            id="homeDomain"
            label="Home Domain"
            onChange={handleFieldChange}
          />
        </div>
        { supportedSeps.length !== 0 && 
          <Select id="seps" label="sep" onChange={handleSepChange}>
            <option></option>
            { supportedSeps.map((sepNum) => (
              <option key={sepNum} value={sepNum}>
                SEP-{sepNum}
              </option>
            )) }
          </Select>
        }
        { supportedAssets.length !== 0 && 
          <Select id="assetCode" label="Asset" onChange={handleAssetCodeChange}>
            {supportedAssets.map(assetCode => (
              <option key={assetCode} value={assetCode}>{assetCode}</option>
            ))}          
          </Select> 
        }
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
        {serverFailure && (
          <InfoBlock variant={InfoBlock.variant.error}>
            {serverFailure}
          </InfoBlock>
        )}
        <div className="ButtonWrapper">
          <Button onClick={handleSubmit} disabled={ [RunState.running, RunState.noTests].includes(runState) || Boolean(serverFailure) }>
            { (runState !== RunState.running) ? "Run Tests" : "Running..." }
          </Button>
          { (runState === RunState.done) && <Button onClick={clearTestResults}>Reset</Button> }
        </div>
      </div>
      <hr />
      <TestCases testCases={ testRunArray }></TestCases>
    </>
  );
};
