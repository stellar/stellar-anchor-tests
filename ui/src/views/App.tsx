import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";
import { Layout } from "@stellar/design-system";

import { TestRunner } from "components/TestRunner";

if (process.env.REACT_APP_SENTRY_KEY) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_KEY,
    release: `anchor-validator@${process.env.npm_package_version}`,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
}

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
