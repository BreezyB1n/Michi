import { productTargetLabel } from "./productPresentation";
import type { PageTarget } from "./types";

export type TargetCallout = {
  title: string;
  detail: string;
  ariaLabel: string;
  style: string;
};

type TargetCalloutOptions = {
  viewportWidth?: number;
  viewportHeight?: number;
};

const calloutWidth = 220;
const calloutHeight = 72;
const viewportInset = 8;
const targetGap = 10;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

export const targetCalloutForTarget = (
  target: PageTarget | undefined,
  { viewportWidth = 1024, viewportHeight = 768 }: TargetCalloutOptions = {}
): TargetCallout | undefined => {
  if (!target?.boundingBox) {
    return undefined;
  }

  const label = productTargetLabel(target);
  const { x, y, height } = target.boundingBox;
  const left = clamp(Math.round(x), viewportInset, viewportWidth - calloutWidth - viewportInset);
  const belowTop = Math.round(y + height + targetGap);
  const aboveTop = Math.round(y - calloutHeight - targetGap);
  const top = clamp(
    belowTop + calloutHeight > viewportHeight - viewportInset ? aboveTop : belowTop,
    viewportInset,
    viewportHeight - calloutHeight - viewportInset
  );

  return {
    title: label,
    detail: "Michi is checking this target for the active guide step.",
    ariaLabel: `Michi target callout: ${label}`,
    style: [
      `left: ${left}px`,
      `top: ${top}px`,
      `width: ${calloutWidth}px`
    ].join("; ")
  };
};
