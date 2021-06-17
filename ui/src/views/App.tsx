import { Layout } from "@stellar/design-system";

import { TestRunner } from "components/TestRunner";
import "./App.scss";

export const App = () => (
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
