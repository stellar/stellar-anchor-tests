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
  --sep-config       Path to a JSON file containing SEP-specific configuration
                     options. See below for config examples.                    [string]
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

### SEP config example

```json
{
  "12": {
    "customers": {
      "toBeCreated": {
        "first_name": "John",
        "last_name": "Doe",
        "email_address": "john@email.com",
        "bank_number": "123",
        "bank_account_number": "456",
        "bank_account_type": "checking"
      },
      "sendingClient": {
        "first_name": "Allie",
        "last_name": "Grater",
        "email_address": "allie@email.com"
      },
      "receivingClient": {
        "first_name": "Lee",
        "last_name": "Sun",
        "email_address": "lee@email.com",
        "clabe_number": "1234",
        "bank_number": "abcd",
        "bank_account_number": "1234",
        "bank_account_type": "checking"
      },
      "toBeDeleted": {
        "first_name": "Jane",
        "last_name": "Doe",
        "email_address": "jane@email.com"
      }
    },
    "createCustomer": "toBeCreated",
    "deleteCustomer": "toBeDeleted",
    "sameAccountDifferentMemos": ["sendingClient", "receivingClient"]
  },
  /*
   * SEP-24 config is optional for enabling partial tests in transaction. 
   * Please provide valid input if you plan to do so.
   */
  "24": {
    "account": {
      "publicKey": "<your_public_key>",
      "secretKey": "<your_secret_key>"
    },
    "depositPendingTransaction": {
      "id": "<id>",
      "status": "any pending_ status"
    },
    "depositCompletedTransaction": {
      "id": "<id>",
      "status": "completed",
      "stellar_transaction_id": "<valid_completed_deposit_transaction_id>"
    },
    "withdrawPendingUserTransferStartTransaction": {
      "id": "<id>",
      "status": "pending_user_transfer_start",
      "amount_in": "222.00",
      "amount_in_asset": "",
      "withdraw_anchor_account": "",
      "withdraw_memo": "<id>",
      "withdraw_memo_type": "text"
    },
    "withdrawCompletedTransaction": {
      "id": "<id>",
      "status": "completed",
      "stellar_transaction_id": "<valid_completed_withdraw_transaction_id>"
    }
  },
  "31": {
    "sendingAnchorClientSecret": "<secret>",
    "sendingClientName": "sendingClient",
    "receivingClientName": "receivingClient",
    "transactionFields": {
      "receiver_account_number": "123",
      "receiver_routing_number": "456",
      "type": "SWIFT"
    }
  },
  "38": {
    "contexts": ["sep31"]
  }
}
```