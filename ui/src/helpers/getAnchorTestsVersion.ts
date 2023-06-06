import PackageJson from "../../package.json";

export const getAnchorTestsVersion = () =>
  PackageJson.dependencies["@stellar/anchor-tests"].replace(/^(\^)/, "");
