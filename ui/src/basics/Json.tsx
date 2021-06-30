import ReactJson, { ReactJsonViewProps } from "react-json-view";

export const Json = ({ src }: ReactJsonViewProps) => (
  <ReactJson
    src={src}
    name={null}
    collapseStringsAfterLength={15}
    displayDataTypes={false}
    displayObjectSize={false}
    collapsed={false}
    theme={{
      base00: "#292d3e",
      base01: "#292d3e",
      base02: "#292d3e",
      base03: "#fbfaf7",
      base04: "#fbfaf7",
      base05: "#fbfaf7",
      base06: "#fbfaf7",
      base07: "#fbfaf7",
      base08: "#fbfaf7",
      base09: "#fbfaf7",
      base0A: "#fbfaf7",
      base0B: "#fbfaf7",
      base0C: "#fbfaf7",
      base0D: "#fbfaf7",
      base0E: "#fbfaf7",
      base0F: "#fbfaf7",
    }}
  />
);
