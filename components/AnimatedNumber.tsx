"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber, formatSigned } from "@/lib/calculator";

const DURATION_MS = 700;

function useCountUp(target: number): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      current.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1);
      const next = from + (target - from) * (1 - Math.pow(1 - t, 3));
      current.current = next;
      setValue(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

type Props = {
  value: number;
  signed?: boolean;
};

export default function AnimatedNumber({ value, signed }: Props) {
  const animated = useCountUp(value);
  return <>{signed ? formatSigned(animated) : formatNumber(animated)}</>;
}
