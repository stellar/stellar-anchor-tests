import styled, { css } from "styled-components";
import { Icon, Loader } from "@stellar/design-system";

import { COLOR_PALETTE } from "constants/styles";

const baseIconStyle = css`
  margin-right: 1.25rem;
`;

export const LoadingIconWrapper = styled.div`
  ${baseIconStyle}
`;

export const LoadingIcon = () => (
  <LoadingIconWrapper>
    <Loader />
  </LoadingIconWrapper>
);

export const IdleIcon = styled(Icon.Minus)`
  ${baseIconStyle}
`;

export const PassedIcon = styled(Icon.Check)`
  ${baseIconStyle}
  stroke: ${COLOR_PALETTE.passed};
`;

export const FailedIcon = styled(Icon.X)`
  ${baseIconStyle}
  stroke: ${COLOR_PALETTE.failed};
`;
