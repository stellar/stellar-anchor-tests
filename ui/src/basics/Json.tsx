import ReactJson, { ReactJsonViewProps } from "react-json-view";

const JSON_COLOR = {
  background: "#292d3e", // SDS --pal-example-code
  color: "#ffffff" // SDS --pal-brand-primary-on
} 

export const Json = ({ src }: ReactJsonViewProps) => (
  <ReactJson
    src={src}
    name={null}
    collapseStringsAfterLength={15}
    displayDataTypes={false}
    displayObjectSize={false}
    collapsed={false}
    theme={{
      base00: JSON_COLOR.background,
      base01: JSON_COLOR.background,
      base02: JSON_COLOR.background,
      base03: JSON_COLOR.color,
      base04: JSON_COLOR.color,
      base05: JSON_COLOR.color,
      base06: JSON_COLOR.color,
      base07: JSON_COLOR.color,
      base08: JSON_COLOR.color,
      base09: JSON_COLOR.color,
      base0A: JSON_COLOR.color,
      base0B: JSON_COLOR.color,
      base0C: JSON_COLOR.color,
      base0D: JSON_COLOR.color,
      base0E: JSON_COLOR.color,
      base0F: JSON_COLOR.color
    }}
  />
);
