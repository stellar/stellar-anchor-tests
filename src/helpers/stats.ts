import { Result, Stats } from "../types";

// TODO
export function getStats(results: Result[]): Stats {
  console.log(results);
  return {
    total: 1,
    passed: 1,
    failed: 0,
  };
}
