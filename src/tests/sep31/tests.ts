import { default as tomlTests } from "./toml";
import { default as infoTests } from "./info";
import { default as transactionsTests } from "./transactions";

export default tomlTests.concat(infoTests, transactionsTests);
