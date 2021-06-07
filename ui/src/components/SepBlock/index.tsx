import { TextLink } from "@stellar/design-system";

import "./styles.scss"

const sepData: any = {
	1: {
		name: "Stellar Info File",
		source: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0001.md"
	},
	6: {
		name: "Deposit and Withdrawal API",
		source: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0006.md"
	},
	10: {
		name: "Stellar Web Authentication",
		source: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0010.md"
	},
	12: {
		name: "KYC API",
		source: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0012.md"
	},
	24: {
		name: "Hosted Deposit and Withdrawal",
		source: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0024.md"
	},
	31: {
		name: "Cross-Border Payments API",
		source: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0031.md"
	}
};

export const SepBlock: React.FC<{ sep: number }> = ({ sep }) => {
	return (
		<>
			<div className="SepBlock">
				<TextLink href={ sepData[sep].source }>SEP-{ sep }: { sepData[sep].name }</TextLink>
			</div>
		</>
	);
}
