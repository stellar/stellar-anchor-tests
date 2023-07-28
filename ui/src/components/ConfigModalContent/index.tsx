import React from "react";
import { Modal, Heading4, TextLink } from "@stellar/design-system";
import { Json } from "basics/Json";

export const ConfigModalContent: React.FC = () => (
  <>
    <Modal.Heading>Configuration Files</Modal.Heading>
    <Modal.Body>
      <p>
        Configuration files are required for running SEP-6, 12, 31 and 38 tests,
        and is optional for SEP-24 tests. These files provide information needed
        for the test suite to interact with your anchor service properly.
      </p>
      <p>
        Configuration files are JSON-formatted and have top-level keys for each
        SEP for which tests are run.
      </p>
      <Json
        src={{
          "6": {},
          "12": {},
          "24": {},
          "31": {},
          "38": {},
        }}
      ></Json>
      <p>The formats for each SEP are outlined below.</p>

      <Heading4>SEP-6</Heading4>
      <p>
        SEP-6 configuration objects are used for specifying the URL parameters
        that should be included to GET /deposit and GET /withdraw requests.
      </p>
      <Json
        src={{
          deposit: {
            transactionFields: {},
          },
          withdraw: {
            types: {
              "bank_account (example)": {
                transactionFields: {},
              },
            },
          },
        }}
      ></Json>
      <ul>
        <li>
          <strong>deposit</strong>: contains a single “transactionFields” key
          <ul>
            <li>
              <strong>transactionFields</strong>: contains the key-value pairs
              to use as parameters to GET /deposit requests. These items should
              correspond directly to the items outlined in GET /info’s{" "}
              <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#for-each-deposit-asset-response-contains">
                fields
              </TextLink>{" "}
              object
            </li>
          </ul>
        </li>
        <li>
          <strong>withdraw</strong>: contains a single “types” key
          <ul>
            <li>
              <strong>types</strong>: an object containing key-value pairs
              corresponding directly to GET /info’s{" "}
              <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#for-each-withdrawal-asset-response-contains">
                types
              </TextLink>{" "}
              object. Currently, only the first type object specified is used.
            </li>
            <ul>
              <li>
                <strong>transactionFields</strong>: contains the key-value pairs
                to use as parameters to GET /withdraw requests for “type”.
              </li>
            </ul>
          </ul>
        </li>
      </ul>

      <Heading4>SEP-12</Heading4>
      <p>
        SEP-12 configuration objects are used for specifying the customer data
        that should be used when making PUT /customer requests.
      </p>
      <p>
        If your anchor requires binary data such as images or PDFs to properly
        KYC customers, select the 'Upload Customer Files' button after uploading
        the configuration file.
      </p>
      <Json
        src={{
          customers: {
            toBeCreated: {
              first_name: "John",
              last_name: "Doe",
              email_address: "joe@email.com",
              bank_number: "123",
              bank_account_number: "123",
            },
            sendingClient: {
              first_name: "Tomer",
              last_name: "Weller",
              email_address: "tomer@stellar.org",
            },
            receivingClient: {
              first_name: "Lydia",
              last_name: "Wagner",
              email_address: "lydia@stellar.org",
            },
            toBeDeleted: {
              first_name: "Jane",
              last_name: "Doe",
              email_address: "jane@email.com",
            },
          },
          createCustomer: "toBeCreated",
          deleteCustomer: "toBeDeleted",
          sameAccountDifferentMemos: ["sendingClient", "receivingClient"],
        }}
      ></Json>
      <ul>
        <li>
          <strong>customers</strong>: an object containing subobjects for each
          customer that will be registered with the anchor. The key-value pairs
          within each subobject must be the{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md">
            SEP-9
          </TextLink>{" "}
          attributes the anchor requires, as well as the{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md#type-specification">
            type
          </TextLink>{" "}
          of the customer. Currently four customers are required.
        </li>
        <li>
          <strong>createCustomer</strong>: a string matching one of the keys
          within the customers object.
        </li>
        <li>
          <strong>deleteCustomer</strong>: a string matching one of the keys
          within the customers object.
        </li>
        <li>
          <strong>sameAccountDifferentMemos</strong>: an array with two strings,
          each of which must be keys in the customers object. Only required if
          SEP-31 configuration is not present.
        </li>
      </ul>
      <p>Each customers key assigned to the other attributes must be unique.</p>

      <Heading4>SEP-24 (optional*)</Heading4>
      <p>
        SEP-24 configuration objects are used for specifying the account
        credentials and transaction parameters that should be used when making
        GET /transaction requests for fetching pending and completed
        transactions.
      </p>
      <p>
        *This SEP-24 configuration object is <strong>optional</strong> so
        Anchors are able to initially skip the tests for pending and completed
        transactions. But we <strong>strongly encourage</strong> Anchors to
        succeed with ALL tests in order to minimize issues before onboarding
        with a new wallet.
      </p>
      <Json
        src={{
          accountHolder: {
            accountAddress:
              "GDTW75HOEQFPAMZ7YTFRN2TMVLVBXK7QYC4AJMXISV2WLD7E7RSZTDIA",
            accountSignerSecretKey:
              "SAMISXU66LL2QDOP3A4EEKIEV4BV7EG3BJYFR65OF6WBOM6IQTDQOKWG",
          },
          depositPendingTransaction: {
            id: "252062",
            status: "any pending_ status",
          },
          depositCompletedTransaction: {
            id: "251876",
            status: "completed",
            stellar_transaction_id:
              "6d51bff72685b3d6a9a951ff695e7cb361865470011447a9f29f81cc2939c445",
          },
          withdrawPendingUserTransferStartTransaction: {
            id: "251986",
            status: "pending_user_transfer_start",
            amount_in: "222.00",
            amount_in_asset:
              "stellar:ARST:GB7TAYRUZGE6TVT7NHP5SMIZRNQA6PLM423EYISAOAP3MKYIQMVYP2JO",
            withdraw_anchor_account:
              "GDMSN2PQ3EB32LZY5JVACI4H7GUVQ3YUWOM4437IDTVQHHWHYG7CGA5Z",
            withdraw_memo: "251986",
            withdraw_memo_type: "text",
          },
          withdrawCompletedTransaction: {
            id: "251938",
            status: "completed",
            stellar_transaction_id:
              "7d9f932216d2476ecd6278c00c1366f2740a40ddbea0e4ec5b5615664592b4ce",
          },
        }}
      ></Json>
      <ul>
        <li>
          <strong>accountHolder</strong>: an object containing the{" "}
          <strong>accountAddress</strong> (public key) of the account which
          holds all the pending and completed transactions (aka{" "}
          <strong>depositPendingTransaction</strong>,{" "}
          <strong>depositCompletedTransaction</strong>,{" "}
          <strong>withdrawPendingUserTransferStartTransaction</strong>,{" "}
          <strong>withdrawCompletedTransaction</strong>) that will be used to
          test against. The <strong>accountHolder</strong> object should also
          contain an <strong>accountSignerSecretKey</strong> param which should
          be a valid signer of the specified <strong>accountAddress</strong>.
        </li>
        <li>
          <strong>depositPendingTransaction</strong>: this object should contain
          an <strong>id</strong> of a <strong>deposit</strong> transaction which
          is in any of the <strong>'pending_' status</strong> usually achieved
          after{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#guidance-for-anchors-closing-the-interactive-popup">
            closing the interactive popup
          </TextLink>
          .
        </li>
        <li>
          <strong>depositCompletedTransaction</strong>: this object should
          contain an <strong>id</strong> of a <strong>deposit</strong>{" "}
          transaction which is in a <strong>'completed' status</strong> usually
          achieved after the user receives the funds in the wallet. This object
          should also contain a <strong>stellar_transaction_id</strong>{" "}
          parameter which is the id of the stellar payment transaction used to
          send funds from Anchor to wallet. The wallet should be able to fetch
          the Sep-24 transaction object through the{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#single-historical-transaction">
            GET /transaction
          </TextLink>{" "}
          endpoint using this <strong>stellar_transaction_id</strong> as the
          query parameter.
        </li>
        <li>
          <strong>withdrawPendingUserTransferStartTransaction</strong>: this
          object should contain an <strong>id</strong> of a{" "}
          <strong>withdrawal</strong> transaction which is specifically in a{" "}
          <strong>'pending_user_transfer_start' status</strong> that should be
          achieved after the user{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#guidance-for-wallets-completing-an-interactive-withdrawal">
            completes the interactive withdrawal
          </TextLink>
          . This is an important <strong>status</strong> on the withdrawal flow
          as it signals to the wallet that it's time to send funds to the Anchor
          using the provided transaction parameters (aka{" "}
          <strong>amount_in</strong>, <strong>amount_in_asset</strong>,{" "}
          <strong>withdraw_anchor_account</strong>,{" "}
          <strong>withdraw_memo</strong>, <strong>withdraw_memo_type</strong>).
        </li>
        <li>
          <strong>withdrawCompletedTransaction</strong>: this object should
          contain an <strong>id</strong> of a <strong>withdrawal</strong>{" "}
          transaction which is in a <strong>'completed' status</strong> usually
          achieved after the user receives the funds in the bank account (or
          other off-chain rails). This object should also contain a{" "}
          <strong>stellar_transaction_id</strong> parameter which is the id of
          the stellar payment transaction used to send funds from wallet to
          Anchor. The wallet should be able to fetch the Sep-24 transaction
          object through the{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md#single-historical-transaction">
            GET /transaction
          </TextLink>{" "}
          endpoint using this <strong>stellar_transaction_id</strong> as the
          query parameter.
        </li>
      </ul>

      <Heading4>SEP-31</Heading4>
      <p>
        SEP-31 configuration objects are used for specifying a variety of data
        items outlined below.
      </p>
      <Json
        src={{
          sendingAnchorClientSecret:
            "SB7E7M6VLBXXIEDJ4RXP7E4SS4CFDMFMIMWERJVY3MSRGNN5ROANA5OJ",
          sendingClientName: "sendingClient",
          receivingClientName: "receivingClient",
          transactionFields: {},
        }}
      ></Json>
      <ul>
        <li>
          <strong>sendingAnchorClientSecret</strong>: the secret key for the
          Stellar keypair that should be used when authenticating with the
          receiving anchor via SEP-10
        </li>
        <li>
          <strong>sendingClientName</strong>: the key of the “customers”
          subobject that should be registered via SEP-12 as the sending client.
        </li>
        <li>
          <strong>receivingClientName</strong>: the key of the “customers”
          subobject that should be registered via SEP-12 as the receiving
          client.
        </li>
        <li>
          <strong>transactionFields</strong>: the{" "}
          <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#post-transactions">
            fields
          </TextLink>{" "}
          object that should be used in POST /transactions requests.
        </li>
      </ul>
      <p>
        Note that there must be a subobject within SEP-12’s{" "}
        <strong>customers</strong> configuration object for the{" "}
        <strong>sendingClientName</strong> and{" "}
        <strong>receivingClientName</strong> properties.
      </p>

      <Heading4>SEP-38</Heading4>
      <p>
        SEP-38 configuration objects are used for specifying with which
        context(s) the tests should be executed, where the valid ones are `sep6`
        and `sep31`.
      </p>
      <Json
        src={{
          contexts: ["sep6", "sep31"],
        }}
      ></Json>
      <ul>
        <li>
          <strong>contexts</strong>: the list of contexts to test. As of this
          date, the supported contexts are `sep6` and `sep31`.
        </li>
      </ul>
    </Modal.Body>
  </>
);
