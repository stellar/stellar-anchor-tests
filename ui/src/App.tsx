import { useEffect, useState } from "react";
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";
import { Layout } from "@stellar/design-system";

import { METRIC_NAMES } from "constants/metricNames";
import { emitMetric } from "helpers/metrics";
import { socket } from "helpers/socketConnection";
import { TestRunner } from "views/TestRunner";

import "./styles.css";

if (process.env.REACT_APP_SENTRY_KEY) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_KEY,
    release: `anchor-validator@${process.env.npm_package_version}`,
    integrations: [new Integrations.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
}

export const App = () => {
  const [pkgVersion, setPkgVersion] = useState("");

  useEffect(() => {
    socket.on("connect", () => {
      socket.emit("getVersion");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.on("getVersion", (version) => {
      setPkgVersion(version);
    });

    return () => {
      socket.off("getVersion");
    };
  }, []);

  useEffect(() => {
    emitMetric(METRIC_NAMES.viewHome);
  }, []);
  return (
    <>
      <Layout.Header
        hasDarkModeToggle
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

      <Layout.Footer gitHubLink="https://github.com/stellar/stellar-anchor-tests">
        {pkgVersion ? (
          <div className="Footer__note">{`@stellar/anchor-tests v${pkgVersion}`}</div>
        ) : null}
      </Layout.Footer>
    </>
  );
};
