import React from "react";

import { SepBlock } from "../SepBlock"
import { TestBlock } from "../TestBlock"

export const SepUIOrder = [1, 10, 12, 6, 24, 31];

export interface TestCase {
	test: any; // Test from @stellar/anchor-tests
	result?: any; // Result from @stellar/anchor-tests
};

export function getTestRunId(test: any): string {
	// sep-group-assertion is unique in @stellar/anchor-tests
	return `${test.sep}:${test.group}:${test.assertion}`
}

/*
 * `tests` should be the return value of a getTests call.
 * The return value should be assigned to testCasesArray.
 */
export function parseTests(tests: any[]): TestCase[] {
	const testRuns = [];
	// this may not be the most efficient way to reorder tests but 
	// Array.sort() may not maintain order if the compare function
	// evaluates two tests as equal, which would happen for tests of
	// the same sep.
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#description
	for (const sep of SepUIOrder) {
		for (const test of tests) {
			if (test.sep === sep)
				testRuns.push({ test });
		}
	}
	return testRuns;
}

type GroupedTestCases = { sep: number, tests: TestCase[] }[];

function groupBySep(testRuns: TestCase[]): GroupedTestCases {
	const groupedTestRuns = [];
	let currentSep;
	for (const testRun of testRuns) {
		if (Number(testRun.test.sep) !== currentSep) {
			currentSep = Number(testRun.test.sep);
			groupedTestRuns.push({ 
				sep: currentSep, 
				tests: [] as TestCase[]
			});
		}
		const sepGroup = groupedTestRuns[groupedTestRuns.length - 1];
		sepGroup.tests.push(testRun);
	}
	return groupedTestRuns;
}

export const TestCases: React.FC<{ testCases: TestCase[] }> = ({ testCases }) => {
	const groupedTestCases = groupBySep(testCases);
	return (
		<>
			<div className="TestCasesWrapper">
	      {groupedTestCases.map((sepGroup: { sep: number, tests: TestCase[] }) => {
	        return (
	        	<div key={ `sep-${sepGroup.sep}-tests` }>
	        		<SepBlock sep={ sepGroup.sep }></SepBlock>
	        		{sepGroup.tests.map((testCase: TestCase) => {
	        			return (
			            <TestBlock
			              key={ getTestRunId(testCase.test) }
			            	testCase={ testCase }
			            ></TestBlock>
	        			);
	        		})}
	          </div>
	        );
	      })}
      </div>
		</>
	);
};
