import PackageJson from "../../package.json";

export const getAnchorTestsVersion = () =>
  PackageJson.peerDependencies["@stellar/anchor-tests"].replace(/^(\^)/, "");
