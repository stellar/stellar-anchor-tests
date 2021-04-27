# Stellar Anchor Tests

`stellar-anchor-tests` is a library and command line tool for testing Stellar
anchors.

## Install

This project is in active development and is not yet published to the npm
registry. To install, run the following commands:

```
git clone git@github.com:stellar/stellar-anchor-tests.git
yarn build
npm link
```

You can now use the `stellar-anchor-tests` command in your shell or use
`npm link @stellar/anchor-tests` in another NodeJS project to use the library in
code.

## Usage

### Command Line Tool

```
$ stellar-anchor-tests -h
Options:
      --help                           Show help                       [boolean]
      --version                        Show version number             [boolean]
  -h, --home-domain                    The home domain of the anchor. The
                                       anchor's TOML file should be present at
                                       <home-domain>/.well-known/stellar.toml.
                                       Prepends 'https://' if no protocol is
                                       specified.            [string] [required]
  -c, --currency                       The currency to use for testing. Must
                                       match one of the CURRENCIES listed in the
                                       TOML file.                       [string]
  -o, --output-format                  The output format to use when sending
                                       content to standard output.
                [string] [choices: "text", "markdown", "json"] [default: "text"]
  -s, --seps                           A list of numbers corresponding to the
                                       SEPs to test.          [array] [required]
  -v, --verbose                        Display the each request and response
                                       used in each failed test.
                                                      [boolean] [default: false]
  -m, --mainnet-master-account-secret  The Stellar account to use when when
                                       funding temporary test accounts.
                                       Currently, 50XLM must be present in the
                                       account.                         [string]
```

```
$ stellar-anchor-tests -h testanchor.stellar.org --seps 1
✔ PASS SEP-1 ❯ Stellar Info File ❯ the file exists at ./well-known/stellar.toml

  A TOML-formatted file exists at URL path ./well-known/stellar.toml
```

### Library

```
import { run, Config } from "@stellar/anchor-tests";

const config: Config = {
  "homeDomain": "testanchor.stellar.org",
  "seps": [1],
};

(async () => {
  for await (const result of run(config)) {
    console.dir(request);
  }
})
```
