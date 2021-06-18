import { Icon } from "@stellar/design-system";

import { TestCase } from "types/testCases";
import { ResultBlock } from "../ResultBlock";
import "./styles.scss";

enum TestBlockVariant {
  passed = "passed",
  failed = "failed",
}

export const TestBlock: React.FC<{ testCase: TestCase }> = ({ testCase }) => {
  let testBlockHeaderVariant;
  if (testCase.result) {
    testBlockHeaderVariant = Boolean(testCase.result.failureMode)
      ? TestBlockVariant.failed
      : TestBlockVariant.passed;
  }
  const variantIcon = {
    [TestBlockVariant.passed]: <Icon.Success />,
    [TestBlockVariant.failed]: <Icon.Error />,
  };
  return (
    <>
      <div
        className={`TestBlockHeader TestBlockHeader--${
          testBlockHeaderVariant || "pending"
        }`}
      >
        {testBlockHeaderVariant && (
          <div className="TestBlockHeader__icon">
            {variantIcon[testBlockHeaderVariant]}
          </div>
        )}
        {testCase.test.group}: {testCase.test.assertion}
      </div>
      {testCase.result && testCase.result.failureMode && (
        <ResultBlock result={testCase.result}></ResultBlock>
      )}
    </>
  );
};
