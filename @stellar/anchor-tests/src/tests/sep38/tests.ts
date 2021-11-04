import { default as tomlTests } from "./toml";
import { default as infoTests } from "./info";
import { default as priceTests } from "./price";
import { default as pricesTests } from "./prices";
import { default as quoteTests } from "./quote";

export default tomlTests.concat(infoTests, pricesTests, priceTests, quoteTests);
