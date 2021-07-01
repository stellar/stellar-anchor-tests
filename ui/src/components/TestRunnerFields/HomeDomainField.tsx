import { useState } from "react";
import { Button, Input, TextLink } from "@stellar/design-system";
import { StellarTomlResolver } from "stellar-sdk";

import { FormData } from "types/testCases";
import { ButtonWrapper } from "basics/ButtonWrapper";
import { FieldWrapper } from "basics/FieldWrapper";
import { TooltipInfoButton } from "basics/Tooltip";

interface HomeDomainFieldProps {
  formData: FormData;
  resetAllState: () => void;
  setFormData: (formData: FormData) => void;
  setServerFailure: (serverFailure: string) => void;
  setToml: (toml: {}) => void;
  setSupportedSeps: (supportedSeps: number[]) => void;
}

export const HomeDomainField = ({
  formData,
  resetAllState,
  setFormData,
  setServerFailure,
  setToml,
  setSupportedSeps,
}: HomeDomainFieldProps) => {
  const [domainStr, setDomainStr] = useState("");
  const updateSupportedSepsState = (tomlObj: { [key: string]: string }) => {
    if (tomlObj) {
      const newSupportedSeps = [1];
      if (tomlObj.TRANSFER_SERVER) {
        newSupportedSeps.push(6);
      }
      if (tomlObj.WEB_AUTH_ENDPOINT) {
        newSupportedSeps.push(10);
      }
      if (tomlObj.KYC_SERVER) {
        newSupportedSeps.push(12);
      }
      if (tomlObj.TRANSFER_SERVER_SEP0024) {
        newSupportedSeps.push(24);
      }
      if (tomlObj.DIRECT_PAYMENT_SERVER) {
        newSupportedSeps.push(31);
      }
      if (newSupportedSeps.length) {
        setServerFailure("");
        setSupportedSeps(newSupportedSeps);
      } else {
        setServerFailure("The Stellar Info File does reference any supported SEP.");
      }
    } else {
      setServerFailure("");
      setSupportedSeps([]);
    }
  };

  // make toml requests at most once every 250 milliseconds
  const getToml = async (homeDomain: string) => {
    const homeDomainHost = new URL(homeDomain).host;
    let tomlObj;
    try {
      tomlObj = await StellarTomlResolver.resolve(homeDomainHost);
    } catch {
      resetAllState();
      setServerFailure("Unable to fetch SEP-1 stellar.toml file");
      return;
    }
    setServerFailure("");
    setToml(tomlObj);
    //updateNetworkState(tomlObj.NETWORK_PASSPHRASE);
    updateSupportedSepsState(tomlObj);
  };

  const handleHomeDomainChange = (value: string) => {
    let domainVal = "";
    if (!value) {
      resetAllState();
      return;
    }
    domainVal = !value.startsWith("http") ? `https://${value}` : value;

    setDomainStr(domainVal);
  };

  const fetchDomain = async (e: React.FormEvent) => {
    e.preventDefault();

    await getToml(domainStr);
    setFormData({
      ...formData,
      homeDomain: domainStr,
    });
  };
  return (
    <>
      <FieldWrapper>
        <Input
          id="homeDomain"
          label="Home Domain"
          onChange={(e) => handleHomeDomainChange(e.target.value)}
        />
        <TooltipInfoButton>
          <p>
            Input the domain that hosts your anchor’s <TextLink underline href="https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md">Stellar Info File</TextLink>.
          </p>
        </TooltipInfoButton>
      </FieldWrapper>
      <ButtonWrapper>
        <Button
          variant={Button.variant.secondary}
          onClick={(e) => fetchDomain(e)}
        >
          Fetch Stellar Info File
        </Button>
      </ButtonWrapper>
    </>
  );
};
