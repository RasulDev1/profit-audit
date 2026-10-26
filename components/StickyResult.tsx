"use client";

import AnimatedNumber from "./AnimatedNumber";

type Props = {
  low: number;
  high: number;
  hidden: boolean;
  onClick: () => void;
};

export default function StickyResult({ low, high, hidden, onClick }: Props) {
  const same = Math.round(low) === Math.round(high);

  return (
    <div
      aria-hidden={hidden}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 transition-[transform,opacity] duration-300 lg:hidden ${
        hidden ? "translate-y-[140%] opacity-0" : ""
      }`}
    >
      <button
        type="button"
        tabIndex={hidden ? -1 : 0}
        onClick={onClick}
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl bg-accent px-4 py-3 text-white shadow-[0_10px_30px_-8px_rgb(37_99_235/.7)] transition-transform active:scale-[.98] [-webkit-tap-highlight-color:transparent]"
      >
        <span className="text-base font-semibold tabular-nums">
          Прирост: {!same && "от "}
          <AnimatedNumber value={low} signed /> руб.
        </span>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className="shrink-0 opacity-80">
          <path d="M12 5v14m0 0-6-6m6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
