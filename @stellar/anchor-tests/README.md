# Stellar Anchor Tests

`@stellar/anchor-tests` is a library and command line tool for testing Stellar anchors.

## Install

```
yarn install --save @stellar/anchor-tests
```

## Usage

### Command Line Tool

```
$ yarn stellar-anchor-tests --help
Options:
      --help         Show help                                         [boolean]
      --version      Show version number                               [boolean]
  -h, --home-domain  The home domain of the anchor. The anchor's TOML file
                     should be present at
                     <home-domain>/.well-known/stellar.toml. Prepends 'https://'
                     if no protocol is specified.            [string] [required]
  -a, --asset-code   The asset code to use for testing. Must match one of the
                     CURRENCIES listed in the TOML file.                [string]
  -s, --seps         A list of numbers corresponding to the SEPs to test.
                                                              [array] [required]
  -v, --verbose      Display the each request and response used in each failed
                     test.                            [boolean] [default: false]
```

```
$ yarn stellar-anchor-tests --seps 1 --home-domain testanchor.stellar.org
✔ SEP-1 ❯ TOML Tests ❯ the TOML file exists at ./well-known/stellar.toml
✔ SEP-1 ❯ TOML Tests ❯ the file has a size less than 100KB
✔ SEP-1 ❯ TOML Tests ❯ has a valid network passphrase
✔ SEP-1 ❯ TOML Tests ❯ has a valid CURRENCIES section
✔ SEP-1 ❯ TOML Tests ❯ all URLs are HTTPS and end without slashes

Tests:       5 passed, 5 total
Time:        0.373s
```

### Library

Check out the complete [API Reference documentation](https://stellar.github.io/stellar-anchor-tests).

```
import { run, Config } from "@stellar/anchor-tests";

const config: Config = {
  "homeDomain": "testanchor.stellar.org",
  "seps": [1],
};

(async () => {
  for await (const testRun of run(config)) {
    console.dir(testRun, { depth: Infinity });
  }
})()
```
