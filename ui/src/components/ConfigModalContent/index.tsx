import React from "react";
import { Modal, Heading4, TextLink } from "@stellar/design-system";
import { Json } from "basics/Json";

export const ConfigModalContent: React.FC = () => (
  <>
    <Modal.Heading>Configuration Files</Modal.Heading>
    <Modal.Body>
      <p>
        Configuration files are required for running SEP-6, 12, and 31 tests. 
        These files provide information required for the test suite to interact with your anchor service properly.
      </p>
      <p>
        Configuration files are JSON-formatted and have top-level keys for each SEP for which tests are run.
      </p>
      <Json src={{
        "6": {},
        "12": {},
        "31": {}
      }}></Json>
      <p>
        The formats for each SEP are outlined below.
      </p>

      <Heading4>SEP-6</Heading4>
      <p>
        SEP-6 configuration objects are used for specifying the URL parameters that should be included to GET /deposit and GET /withdraw requests.
      </p>
      <Json src={{
        "deposit": {
          "transactionFields": {}
        },
        "withdraw": {
          "types": {
            "bank_account (example)": {
              "transactionFields": {}
            }
          }
        }
      }}></Json>
      <ul>
        <li>
          <strong>deposit</strong>: contains a single "transactionFields" key
          <ul>
            <li><strong>transactionFields</strong>: contains the key-value pairs to use as parameters to GET /deposit requests. These items should correspond directly to the items outlined in GET /info's <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#for-each-deposit-asset-response-contains">fields</TextLink> object</li>
          </ul>
        </li>
        <li>
          <strong>withdraw</strong>: contains a single "types" key
          <ul>
            <li><strong>types</strong>: an object containing key-value pairs corresponding directly to GET /info's <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md#for-each-withdrawal-asset-response-contains">types</TextLink> object. Currently, only the first type object specified is used.</li>
            <ul>
              <li><strong>transactionFields</strong>: contains the key-value pairs to use as parameters to GET /withdraw requests for "type".</li>
            </ul>
          </ul>
        </li>
      </ul>

      <Heading4>SEP-12</Heading4>
      <p>
        SEP-12 configuration objects are used for specifying the customer data that should be used when making PUT /customer requests. Currently, binary data is not supported.
      </p>
      <Json src={{
        "customers": {
          "sep6Customer": {
            "first_name": "John",
            "last_name": "Doe",
            "email_address": "joe@email.com",
            "bank_number": "123",
            "bank_account_number": "123",
          },
          "toBeDeleted": {
            "first_name": "Jane",
            "last_name": "Doe",
            "email_address": "jane@email.com"
          }
        }
      }}></Json>
      <ul>
        <li><strong>customers</strong>: an object containing subobjects for each customer that will be registered with the anchor. The key-value pairs within each subobject must be the <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0009.md">SEP-9</TextLink> attributes the anchor requires.</li>
      </ul>
      <p>
        Currently two customer subobjects are required. 
        The customer represented by the first subobject will be used in SEP-6 deposit and withdraw requests, while the last subobject will be used to test the DELETE /customer endpoint.
      </p>

      <Heading4>SEP-31</Heading4>
      <p>
        SEP-31 configuration objects are used for specifying a variety of data items outlined below.
      </p>
      <Json src={{
        "sendingAnchorClientSecret": "SB7E7M6VLBXXIEDJ4RXP7E4SS4CFDMFMIMWERJVY3MSRGNN5ROANA5OJ",
        "sendingClientName": "sendingClient",
        "receivingClientName": "receivingClient",
        "transactionFields": {}
      }}></Json>
      <ul>
        <li><strong>sendingAnchorClientSecret</strong>: the secret key for the Stellar keypair that should be used when authenticating with the receiving anchor via SEP-10</li>
        <li><strong>sendingClientName</strong>: the key of the "customers" subobject that should be registered via SEP-12 as the sending client.</li>
        <li><strong>receivingClientName</strong>: the key of the "customers" subobject that should be registered via SEP-12 as the receiving client.</li>
        <li><strong>transactionFields</strong>: the <TextLink href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md#post-transactions">fields</TextLink> object that should be used in POST /transactions requests.</li>
      </ul>
      <p>
        Note that there must be a subobject within SEP-12's <strong>customers</strong> configuration object for the <strong>sendingClientName</strong> and <strong>receivingClientName</strong> properties.
      </p>
    </Modal.Body>
  </>
);
