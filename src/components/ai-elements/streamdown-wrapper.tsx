"use client";

import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { Streamdown } from "streamdown";
import type { ComponentProps } from "react";

const streamdownPlugins = { code, math };

export default function StreamdownWrapper(
  props: Omit<ComponentProps<typeof Streamdown>, "plugins">,
) {
  return <Streamdown plugins={streamdownPlugins} {...props} />;
}
