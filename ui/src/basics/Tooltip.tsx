import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Icon } from "@stellar/design-system";

export const InfoButton = styled.div`
  cursor: pointer;
  width: 1.25rem;
  height: 1.25rem;
  margin-left: 0.3rem;
  margin-top: 1.375rem;
  flex-shrink: 0;
  position: relative;

  svg {
    width: 100%;
    height: 100%;
    fill: var(--pal-background-tertiary);
    position: absolute;
    top: 0;
    left: 0;
  }
`;

const InfoButtonTooltipEl = styled.div`
  border-radius: 0.25rem;
  background-color: var(--pal-brand-primary);
  color: var(--pal-brand-primary-on);
  cursor: default;
  font-size: 0.875rem;
  line-height: 1.5rem;
  margin-top: 1.25rem;
  padding: 1rem 1.5rem;
  position: absolute;
  top: 4.2rem;
  right: -5.5rem;
  z-index: 1;
  visibility: hidden;

  &[data-hidden="false"] {
    visibility: visible;
  }

  p {
    color: inherit;
  }

  a {
    color: inherit;
    white-space: nowrap;
  }
`;

export const ModalInfoButton = ({ onClick }: { onClick: () => void }) => (
  <InfoButton onClick={onClick}>
    <Icon.Info />
  </InfoButton>
);

export const TooltipInfoButton = ({
  children,
}: {
  children: React.ReactElement | string;
}) => {
  const toggleEl = useRef<null | HTMLDivElement>(null);
  const infoEl = useRef<null | HTMLDivElement>(null);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  useEffect(() => {
    if (isInfoVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInfoVisible]);

  const handleClickOutside = (event: MouseEvent) => {
    // Do nothing if clicking tooltip itself or link inside the tooltip
    if (
      event.target === infoEl?.current ||
      infoEl?.current?.contains(event.target as Node)
    ) {
      return;
    }

    if (!toggleEl?.current?.contains(event.target as Node)) {
      setIsInfoVisible(false);
    }
  };

  return (
    <>
      <InfoButton
        ref={toggleEl}
        onClick={() => setIsInfoVisible((currentState) => !currentState)}
      >
        <Icon.Info />
      </InfoButton>

      {isInfoVisible && <InfoButtonTooltipEl ref={infoEl} data-hidden={!isInfoVisible}>
        {children}
      </InfoButtonTooltipEl>}
    </>
  );
};
