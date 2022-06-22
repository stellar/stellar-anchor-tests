export function getQuotesRequiredFromInfo(
  sep31Info: undefined,
  assetCode: string,
): boolean {
  // @ts-ignore
  return sep31Info.receive[assetCode].quotes_required;
}

export function getQuotesSupportedFromInfo(
  sep31Info: undefined,
  assetCode: string,
): boolean {
  // @ts-ignore
  return sep31Info.receive[assetCode].quotes_supported;
}
