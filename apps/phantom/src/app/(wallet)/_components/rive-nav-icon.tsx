"use client";

import React, { useEffect, useCallback } from "react";
import { useRive, useStateMachineInput, Layout, Fit, Alignment } from "@rive-app/react-canvas";
import { useRiveAsset } from "./rive-asset-provider";

interface RiveNavIconProps {
  src: string;
  isActive: boolean;
  size?: number;
  /** State machine name inside the .riv file (defaults to "State Machine 1") */
  stateMachine?: string;
  /** Boolean input name that controls active/idle (defaults to "active") */
  inputName?: string;
}

const RiveNavIcon: React.FC<RiveNavIconProps> = ({
  src,
  isActive,
  size = 34,
  stateMachine = "mainMachine",
  inputName = "isActive",
}) => {
  const assetBuffer = useRiveAsset(src);

  const riveParams = React.useMemo(() => ({
    buffer: assetBuffer || undefined,
    // We strictly avoid passing 'src' to prevent the Rive SDK from 
    // initiating its own fetch request, as we manage the preloading 
    // via RiveAssetProvider.
    stateMachines: stateMachine,
    autoplay: true,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  }), [assetBuffer, stateMachine]);

  const { rive, RiveComponent } = useRive(riveParams);

  const activeInput = useStateMachineInput(rive, stateMachine, inputName);

  useEffect(() => {
    if (activeInput) {
      activeInput.value = isActive;
    }
  }, [isActive, activeInput]);

  return (
    <div
      style={{
        width: size,
        height: size,
        pointerEvents: "none",
        contain: "strict",
      }}
    >
      {assetBuffer && (
        <RiveComponent
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      )}
    </div>
  );
};

export default React.memo(RiveNavIcon);
