import { Widgets } from 'blessed';

export const Helpers = {
  Math: {
    /** Cap the value between two ranges (inclusive). */
    Contain: (value: number, min: number, max: number) =>
      Math.max(min, Math.min(value, max)),
  },
};

export const IsNotNull = <T>(val: T | null | undefined): val is T =>
  val != null;

export const AsStyleObj = (style: Widgets.ElementOptions['style']) => {
  return {
    fg: style?.fg ?? undefined,
    bg: style?.bg ?? undefined,
    bold: style?.bold ?? undefined,
    underline: style?.underline ?? undefined,
    blink: style?.blink ?? undefined,
    inverse: style?.inverse ?? undefined,
    invisible: style?.invisible ?? undefined,
    transparent: style?.transparent ?? undefined,
    border: {
      fg: style?.border?.fg ?? undefined,
      bg: style?.border?.bg ?? undefined,
    },
    ...style,
  };
};
