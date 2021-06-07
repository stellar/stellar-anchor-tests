import React from "react";

export const ResultBlock: React.FC<{ result : any }> = ({ result }) => { 
	return <>
		<div className="ResultBlock">{ result.failure ? result.failure.message : "passed" }</div>
	</>
};
