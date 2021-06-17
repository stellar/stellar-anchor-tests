import React from "react";

import "./styles.scss"

export const ResultBlock: React.FC<{ result : any }> = ({ result }) => { 
	return <>
		<div className="ResultBlock">
			{ result.failureMode && result.failureMessage }
		</div>
	</>
};
