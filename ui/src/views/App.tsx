import { useEffect } from "react";
import { Layout } from "@stellar/design-system";

import { METRIC_NAMES } from "constants/metricNames";
import { emitMetric } from "helpers/metrics";
import { TestRunner } from "components/TestRunner";

export const App = () => {
  useEffect(() => {
    emitMetric(METRIC_NAMES.viewHome);
  }, []);
  return (
    <>
      <Layout.Header
        projectTitle="Anchor Validator"
        projectLink="https://www.stellar.org"
      >
        <p>A test suite for validating SEP6, SEP24, SEP31 transfer servers.</p>
      </Layout.Header>

      <Layout.Content>
        <Layout.Inset>
          <TestRunner />
        </Layout.Inset>
      </Layout.Content>

      <Layout.Footer gitHubLink="https://github.com/stellar/stellar-anchor-tests" />
    </>
  );
};
