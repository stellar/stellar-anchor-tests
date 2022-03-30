# Changelog

This changelog documents all releases and included changes to the @stellar/anchor-tests library.

A breaking change will get clearly marked in this log.

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