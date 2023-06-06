import PackageJson from "../package.json";

export const anchorTestsPkgVersion = () =>
  PackageJson.peerDependencies["@stellar/anchor-tests"].replace(/^(\^)/, "");
