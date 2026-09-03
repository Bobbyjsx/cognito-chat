"use client";

import { code } from "@streamdown/code";
import { createMathPlugin } from "@streamdown/math";
import { Streamdown } from "streamdown";
import type { ComponentProps } from "react";
import { preprocessMathAndLatex } from "@/lib/math";

const mathPlugin = createMathPlugin({
  singleDollarTextMath: true,
  errorColor: "var(--color-destructive, #ef4444)",
});

const streamdownPlugins = {
  code,
  math: mathPlugin,
};

export default function StreamdownWrapper({
  children,
  ...props
}: Omit<ComponentProps<typeof Streamdown>, "plugins">) {
  const processedChildren =
    typeof children === "string" ? preprocessMathAndLatex(children) : children;

  return (
    <Streamdown plugins={streamdownPlugins} {...props}>
      {processedChildren}
    </Streamdown>
  );
}
