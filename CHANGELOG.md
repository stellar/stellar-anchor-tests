# Changelog

This changelog documents all releases and included changes to the @stellar/anchor-tests library.

A breaking change will get clearly marked in this log.

## [v0.5.4](https://github.com/stellar/stellar-anchor-tests/compare/v0.5.3...v0.5.4)

### Update

- Add network calls to the test results for the following tests
  - SEP-12: can delete a customer

## [v0.5.3](https://github.com/stellar/stellar-anchor-tests/compare/v0.5.2...v0.5.3)

### Update

- Add network calls to the test results for the following tests
  - SEP-12: memos differentiate customers registered by the same account

## [v0.5.2](https://github.com/stellar/stellar-anchor-tests/compare/v0.5.1...v0.5.2)

### Update

- Use the account configured as the SEP-31 sending anchor when authenticating for the following test, if specified
  - SEP-10: returns a valid JWT

## [v0.5.1](https://github.com/stellar/stellar-anchor-tests/compare/v0.5.0...v0.5.1)

### Update

- Add SEP-31+38 tests ([#90](https://github.com/stellar/stellar-anchor-tests/pull/90))
  - SEP-31+38 tests run when both SEPs are enabled and `quotes_required` is true.
  - SEP-31 tests now test for failure if SEP-38 is not implemented and `quotes_supported` is true.

### Update

## [v0.5.0](https://github.com/stellar/stellar-anchor-tests/compare/v0.4.1...v0.5.0)

### Update

- Update SEP-38 tests based on [stellar/stellar-protocol#1204](https://github.com/stellar/stellar-protocol/pull/1204). The changes include ([#86](https://github.com/stellar/stellar-anchor-tests/pull/86)):
  - SEP-38 `GET /price` and `POST /quote` now require the mandatory `context` request parameter.
  - SEP-38 `GET /price` and `GET|POST /quote` now return the mandatory response parameters `total_price` and `fee`.
  - The SEP-38 amounts formula validation was updated based on the new version from [SEP38#price-formulas](https://github.com/stellar/stellar-protocol/blob/faa99165050dcd44a9e0f700c3d019258d8b4321/ecosystem/sep-0038.md#price-formulas).

- SEP-38 now requires a config file to indicate which contexts should be tested. ([#87](https://github.com/stellar/stellar-anchor-tests/pull/87))

## [v0.4.1](https://github.com/stellar/stellar-anchor-tests/compare/v0.4.0...v0.4.1)

### Update

- If one or more tests don't pass, we make sure to fail the process. This way, CIs will understand the process was unsuccessful. ([#84](https://github.com/stellar/stellar-anchor-tests/pull/84))

## [v0.4.0](https://github.com/stellar/stellar-anchor-tests/compare/v0.3.0...v0.4.0)

### Update

- SEP-12 tests no longer include the `account` request parameter since it has been deprecated. ([#82](https://github.com/stellar/stellar-anchor-tests/pull/82))

## [v0.3.0](https://github.com/stellar/stellar-anchor-tests/compare/v0.2.0...v0.3.0)

### Update

- Stop requiring athentication for the SEP-38 `/price(s)` endpoints, because authentication stoped being mandatory for non-quote endpoints on [PR stellar-protocol#1144](https://github.com/stellar/stellar-protocol/pull/1144).

### Fix

- Fix SEP-38 toml variable name from `QUOTE_SERVER` to `ANCHOR_QUOTE_SERVER`.

## [v0.2.0](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.7...v0.2.0)

### Add

- Added tests for SEP-38 endpoints ([#73](https://github.com/stellar/stellar-anchor-tests/pull/73))

### Update

- Update the expected response schema for `GET /customer` requests

## [v0.1.7](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.6...v0.1.7)

### Add

- Use `type` parameter in SEP-12 `GET /customer` requests

## [v0.1.6](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.5...v0.1.6)

## [v0.1.5](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.4...v0.1.5)

## [v0.1.4](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.3...v0.1.4)

## [v0.1.3](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.2...v0.1.3)

## [v0.1.2](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.1...v0.1.2)

## [v0.1.1](https://github.com/stellar/stellar-anchor-tests/compare/v0.1.0...v0.1.1)

## v0.1.0