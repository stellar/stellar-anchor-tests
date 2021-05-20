import { default as tomlTests } from "./toml";
import { default as infoTests } from "./info";
import { default as depositTests } from "./deposit";
import { default as withdrawTests } from "./withdraw";
import { default as transactionTests } from "./transaction";
import { default as transactionsTests } from "./transactions";

export default tomlTests.concat(
  infoTests,
  depositTests,
  withdrawTests,
  transactionTests,
  transactionsTests,
);
