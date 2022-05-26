import { default as tomlTests } from "./toml";
import { default as infoTests } from "./info";
import { default as pricesTests } from "./prices";
import { default as priceTests } from "./price";
import { default as postQuoteTests } from "./postQuote";
import { default as getQuoteTests } from "./getQuote";

export default tomlTests.concat(
  infoTests,
  pricesTests,
  priceTests,
  postQuoteTests,
  getQuoteTests,
);
