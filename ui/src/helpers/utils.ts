import fetch from "node-fetch";

export async function getSupportedAssets(
  url: string,
  sep: number
): Promise<Array<string>> {
  console.log("calling /info");
  const infoResp = await fetch(url + "/info");
  if (infoResp.status !== 200)
    throw new Error("unexpected status code from /info");
  const infoJson = await infoResp.json();
  if ([6, 24].includes(sep)) {
    const depositAssets = Object.keys(infoJson.deposit);
    const withdrawAssets = Object.keys(infoJson.withdraw);
    return Array.from(new Set(depositAssets.concat(withdrawAssets)));
  } else {
    return Object.keys(infoJson.receive);
  }
}
